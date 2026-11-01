import Reveal from './Reveal';

export default function SectionHead({ eyebrow, title, text, center = false, as: H = 'h2' }) {
  return (
    <Reveal className={`mb-10 sm:mb-14 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <H className="h-section mt-3">{title}</H>
      {text && <p className="lead mt-4">{text}</p>}
    </Reveal>
  );
}
