export default function MobileHeader() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center px-5"
      style={{
        background:  "#1E2B3C",
        boxShadow:   "0 4px 20px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.06)",
        height:      "56px",
        paddingTop:  "env(safe-area-inset-top)",
      }}
    >
      <span className="text-[17px] font-semibold tracking-tight text-white">
        Trackr
      </span>
    </header>
  );
}
