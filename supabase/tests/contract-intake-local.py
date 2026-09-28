"""Local-only TUS integration test. Reads local Docker credentials in memory; never prints them."""
import base64,hashlib,hmac,json,subprocess,time,uuid,urllib.request,urllib.parse
DB='supabase_db_SADUMAHA-main'
def sql(query):
 query='begin;'+query+'commit;'
 r=subprocess.run(['docker','exec','-i',DB,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-qtA'],input=query,capture_output=True,text=True)
 if r.returncode: raise RuntimeError('Local SQL fixture/check failed: '+r.stderr)
 return r.stdout.strip()
c=json.loads(subprocess.check_output(['docker','inspect','supabase_storage_SADUMAHA-main']))[0]
env=dict(v.split('=',1) for v in c['Config']['Env']); assert env['FILE_SIZE_LIMIT']=='2147483648'
port=subprocess.check_output(['docker','port','supabase_kong_SADUMAHA-main','8000/tcp'],text=True).strip().splitlines()[0].rsplit(':',1)[1]
base='http://127.0.0.1:'+port
user,scenario,zone=str(uuid.uuid4()),str(uuid.uuid4()),str(uuid.uuid4());contract='tus-test-'+str(uuid.uuid4());path=f'{user}/contract-intake/{scenario}/passport.pdf'
b64=lambda b:base64.urlsafe_b64encode(b).rstrip(b'=').decode()
header=b64(json.dumps({'alg':'HS256','typ':'JWT'}).encode());payload=b64(json.dumps({'sub':user,'role':'authenticated','institutional_role':'ARTIST','aud':'authenticated','exp':int(time.time())+600}).encode());unsigned=header+'.'+payload
token=unsigned+'.'+b64(hmac.new(env['AUTH_JWT_SECRET'].encode(),unsigned.encode(),hashlib.sha256).digest())
def request(url,method,data=None,extra=None,service=False):
 headers={'apikey':env['ANON_KEY'],'Authorization':'Bearer '+(env['SERVICE_KEY'] if service else token),'Tus-Resumable':'1.0.0'};headers.update(extra or {})
 return urllib.request.urlopen(urllib.request.Request(url,data=data,headers=headers,method=method),timeout=60)
created=False;location=None
try:
 sql(f"select set_config('request.jwt.claims', '{{\"sub\":\"{user}\",\"institutional_role\":\"ARTIST\"}}', true); insert into auth.users(id) values('{user}'); insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('{contract}','{user}','Fictional local TUS test','ARTIST_APPROVED');")
 created=True
 sql(f"insert into public.sadu_contract_intake(id,contract_id,artist_id,kind,object_name,file_name) values('{scenario}','{contract}','{user}','PASSPORT','{path}','passport.pdf');")
 size=1024; chunk=1024
 metadata=','.join(k+' '+base64.b64encode(v.encode()).decode() for k,v in {'bucketName':'logistics-secure','objectName':path,'contentType':'application/pdf'}.items())
 with request(base+'/storage/v1/upload/resumable','POST',b'',{'Upload-Length':str(size),'Upload-Metadata':metadata}) as r: location=r.headers['Location']
 location=urllib.parse.urljoin(base,location)
 assert urllib.parse.urlparse(location).hostname in ('127.0.0.1','localhost'), 'Unexpected non-local TUS destination'
 with request(location,'PATCH',b'%PDF-1.7'+bytes(chunk-8),{'Upload-Offset':'0','Content-Type':'application/offset+octet-stream'}) as r: assert int(r.headers['Upload-Offset'])==chunk
 # A new request models a client reconnect without retaining its own offset.
 with request(location,'HEAD') as r: offset=int(r.headers['Upload-Offset'])
 assert offset==chunk
 while offset<size:
  length=min(chunk,size-offset)
  with request(location,'PATCH',bytes(length),{'Upload-Offset':str(offset),'Content-Type':'application/offset+octet-stream'}) as r: offset=int(r.headers['Upload-Offset'])
 actual=sql(f"select metadata->>'size' from storage.objects where bucket_id='logistics-secure' and name='{path}';")
 assert int(actual)==size
 print('PASS: fictional passport PDF uploaded using Artist token to private contract intake; server byte count verified.')
finally:
 if created:
  # Only the exact test object and randomly identified fixtures created above are removed.
  try:
   with request(base+'/storage/v1/object/logistics-secure','DELETE',json.dumps({'prefixes':[path]}).encode(),{'Content-Type':'application/json'},True):pass
  finally:
   sql(f"delete from public.sadu_contract_intake where id='{scenario}';delete from public.bilateral_contracts where id='{contract}';delete from auth.users where id='{user}';")
