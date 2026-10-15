# SADU SOURCE OF TRUTH
- All state transitions must adhere strictly to established ThemeStatus and ArtistStatus enums.
- Arabic RTL parity is mandatory: NEVER use physical CSS (pl-, pr-, ml-, mr-, text-left, text-right). Exclusively use Tailwind logical properties (ps-, pe-, ms-, me-, text-start, text-end).
- Institutional role labels must use official Arabic terminology (رئيس الدائرة, مدير الملتقى, اللجنة التحضيرية, قسم التحرير, المنسقة, المالية).
- "Head of International Programs" (HIP) is permanently removed; master coordination belongs exclusively to General Exhibition Coordinator (المنسقة).
- Decouple curatorial assessment from executive decisions: Committee outputs a recommendation minute, not a database approval.

Read SADU_ARCHITECTURE.md before changing workflow or permissions. Keep real integrations paused. Preserve unrelated work; never commit secrets. Run relevant checks and report actual verification.

