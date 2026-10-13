/**
 * Placeholder shell until the app routes land (see docs/ROADMAP.md).
 * Strings are hardcoded here on purpose; i18n arrives with the app shell task.
 */
function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="font-medium tracking-[0.2em] text-forest-600 uppercase">
        วิสาหกิจชุมชนป่าต้นผึ้ง
      </p>
      <h1 className="font-display max-w-2xl text-3xl font-bold text-teak-700 text-balance sm:text-5xl">
        Pa Ton Phueng Customizer — coming soon
      </h1>
      <p className="max-w-xl text-base text-ink-500 sm:text-lg">
        เลือกผลิตภัณฑ์ ใส่ลายพิมพ์ใบไม้ของชุมชน และดูผลลัพธ์แบบสด ๆ
      </p>
      <span
        aria-hidden="true"
        className="h-1 w-24 rounded-full bg-marigold-500"
      />
    </main>
  )
}

export default App
