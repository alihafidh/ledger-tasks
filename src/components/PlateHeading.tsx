// The Broadsheet plate headline — the page title printed as its C/M/Y
// process plates, a breath out of register (see broadsheet.css .cmyk-head).
export default function PlateHeading({ text }: { text: string }) {
  return (
    <h1 className="cmyk-head page-title">
      <span className="paper">{text}</span>
      <span className="plate plate-c" aria-hidden="true">
        {text}
      </span>
      <span className="plate plate-m" aria-hidden="true">
        {text}
      </span>
      <span className="plate plate-y" aria-hidden="true">
        {text}
      </span>
    </h1>
  );
}
