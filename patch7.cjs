const fs = require('fs');
let content = fs.readFileSync('src/components/StoryMode.tsx', 'utf8');

const oldRender = `{current.type === 'leadership-portrait' ? (
              <div className="grid md:grid-cols-2 gap-8 h-full items-stretch flex-1">`;
              
const newRender = `{current.type === 'leadership-portrait' ? (
              <div className={\`grid md:grid-cols-2 gap-8 h-full items-stretch flex-1 \${current.id === 'leadership-operational' ? "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAwLCAwLCAwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] bg-repeat" : ""}\`}>`;

content = content.replace(oldRender, newRender);
fs.writeFileSync('src/components/StoryMode.tsx', content);
