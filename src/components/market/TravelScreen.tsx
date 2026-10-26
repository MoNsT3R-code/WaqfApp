/**
 * Travel: Lahore hotels (rate × nights), flights from Lahore (fare × passengers) and trip
 * deals, as masonry cover cards. A card grows into its booking panel (a shared layout
 * animation) and shrinks back when closed. Totals show before anything is booked; the
 * server prices the booking again.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { LIMITS, type Flight, type Hotel, type TripDeal } from "../../../shared/marketplace";
import { covers } from "../../../shared/covers";
import { cn } from "../../lib/utils";
import { PrimaryButton, SecondaryButton, Stepper } from "./parts";
import { AnimatedPkr, LensCover, MotionTabs, PhotoCredits } from "./motionParts";
import { cardMotion, fill, formatDay, formatDuration, formatPkr } from "./helpers";
import type { translations } from "../../translations";

export type TravelTab = "Hotels" | "Flights" | "Packages";
type MarketLabels = (typeof translations)["en"]["market"];

const pad = (n: number) => String(n).padStart(2, "0");
const localIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => localIso(new Date());
const tomorrow = () => localIso(new Date(Date.now() + 86_400_000));

type Props = {
  hotels: Hotel[];
  flights: Flight[];
  packages: TripDeal[];
  tab: TravelTab;
  setTab: (tab: TravelTab) => void;
  t: MarketLabels;
  lang: string;
  isProcessing: boolean;
  onBookHotel: (hotel: Hotel, checkIn: string, nights: number) => void;
  onBookFlight: (flight: Flight, passengers: number) => void;
  onBookDeal: (deal: TripDeal) => void;
  onAddHotel: (hotel: Hotel, checkIn: string, nights: number) => void;
  onAddFlight: (flight: Flight, passengers: number) => void;
};


const spring = { type: "spring", stiffness: 380, damping: 36 } as const;

export function TravelScreen(props: Props) {
  const { hotels, flights, packages, tab, setTab, t, lang } = props;
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const titles: Record<TravelTab, string> = { Hotels: t.hotelsTitle, Flights: t.flightsTitle, Packages: t.dealsTitle };

  useEffect(() => setSelected(null), [tab]);

  type Card = { id: string; title: string; subtitle: string; price: number; per?: string; meta?: string };
  const cards: Card[] =
    tab === "Hotels" ? hotels.map(h => ({ id: h.id, title: h.name, subtitle: `${h.area} · ${h.room}`, price: h.pricePerNight, per: t.perNight }))
    : tab === "Flights" ? flights.map(f => ({
        id: f.id,
        title: `${f.from.city} → ${f.to.city}`,
        subtitle: `${f.airline} · ${formatDay(f.date, lang)} · ${f.departs} → ${f.arrives}`,
        meta: `${formatDuration(f.durationMinutes)} · ${f.stops === 0 ? t.nonstop : f.stops} · ${f.cabin}`,
        price: f.farePerPassenger,
        per: t.perPassenger,
      }))
    : packages.map(p => ({ id: p.id, title: p.name, subtitle: p.description, price: p.price }));

  const open = cards.find(c => c.id === selected) || null;

  return (
    <LayoutGroup>
      <div className="relative flex h-full min-h-0 flex-col">
        <MotionTabs
          id="travel"
          label={t.hotelsTitle}
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "Hotels", label: t.hotels, count: hotels.length },
            { id: "Flights", label: t.flights, count: flights.length },
            { id: "Packages", label: t.deals, count: packages.length },
          ]}
        />
        <motion.div layoutScroll className="min-h-0 flex-1 overflow-y-auto pe-1 pt-5 scrollbar-hide">
          <h3 className="text-base font-semibold text-[var(--text-p)]">{titles[tab]}</h3>

          {/* Pinterest-style masonry: each card keeps its photo's own proportions */}
          <div key={tab} className="mt-4 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {cards.map((card, index) => {
              const cover = covers[card.id];
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  layoutId={reduce ? undefined : `card-${card.id}`}
                  {...cardMotion(index, reduce)}
                  onClick={() => setSelected(card.id)}
                  aria-haspopup="dialog"
                  style={{ opacity: selected === card.id ? 0 : undefined }}
                  className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-[var(--raised)] text-start transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {cover && (
                    <motion.div layoutId={reduce ? undefined : `cover-${card.id}`}>
                      <LensCover cover={cover} ratio={Math.min(0.9, Math.max(0.55, cover.height / cover.width))} className="w-full" lens={110} />
                    </motion.div>
                  )}
                  <div className="p-4">
                    <motion.p layoutId={reduce ? undefined : `title-${card.id}`} className="text-base font-semibold text-[var(--text-p)]">{card.title}</motion.p>
                    <p className="mt-0.5 text-[13px] text-[var(--text-s)]">{card.subtitle}</p>
                    {card.meta && <p className="mt-0.5 text-[13px] text-[var(--text-s)]">{card.meta}</p>}
                    <p className="tabular mt-3 text-[15px] font-semibold text-[var(--text-p)]">
                      {formatPkr(card.price)}{card.per && <span className="ms-1 text-[13px] font-normal text-[var(--text-s)]">{card.per}</span>}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <PhotoCredits ids={[...hotels, ...flights, ...packages].map(x => x.id)} t={t} />
        </motion.div>

        <AnimatePresence>
          {open && (
            <DetailPanel key={open.id} id={open.id} title={open.title} onClose={() => setSelected(null)} t={t}>
              {tab === "Hotels" && <HotelBooking {...props} hotel={hotels.find(h => h.id === open.id)!} />}
              {tab === "Flights" && <FlightBooking {...props} flight={flights.find(f => f.id === open.id)!} />}
              {tab === "Packages" && <DealBooking {...props} deal={packages.find(p => p.id === open.id)!} />}
            </DetailPanel>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

/** The card, grown into its booking panel */
function DetailPanel({ id, title, onClose, t, children }: { id: string; title: string; onClose: () => void; t: MarketLabels; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const cover = covers[id];

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => { window.removeEventListener("keydown", onKey, true); previous?.focus?.({ preventScroll: true }); };
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto p-1 sm:items-center">
      <motion.div className="absolute inset-0 bg-[var(--card)]/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        layoutId={reduce ? undefined : `card-${id}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        transition={spring}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[var(--raised)] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      >
        {cover && (
          <motion.div layoutId={reduce ? undefined : `cover-${id}`} transition={spring}>
            <LensCover cover={cover} eager className="h-48 w-full sm:h-64" lens={150} />
          </motion.div>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-5 sm:p-6">
          <motion.p layoutId={reduce ? undefined : `title-${id}`} transition={spring} className="text-lg font-semibold text-[var(--text-p)]">{title}</motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function HotelBooking({ hotel, t, isProcessing, onBookHotel, onAddHotel }: Props & { hotel: Hotel }) {
  const [checkIn, setCheckIn] = useState(tomorrow());
  const [nights, setNights] = useState(1);
  const total = hotel.pricePerNight * nights;
  const validDate = checkIn >= today();

  return (
    <div>
      <p className="mt-1 text-sm text-[var(--text-s)]">{hotel.area} · {hotel.room}</p>
      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--text-p)]">{t.checkIn}</span>
          <input
            type="date"
            value={checkIn}
            min={today()}
            onChange={e => setCheckIn(e.target.value)}
            className="h-10 rounded-lg border border-[var(--control)] bg-[var(--bg)] px-3 text-sm text-[var(--text-p)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <div>
          <span className="mb-2 block text-[13px] font-medium text-[var(--text-p)]">{t.nights}</span>
          <Stepper value={nights} min={1} max={LIMITS.nights} onChange={setNights} label={t.nights} />
        </div>
        <div className="tabular ms-auto text-end">
          <p className="text-[13px] text-[var(--text-s)]">{fill(t.rateTimes, { rate: formatPkr(hotel.pricePerNight), n: nights })}</p>
          <p className="text-xl font-semibold text-[var(--text-p)]"><AnimatedPkr value={total} /></p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <SecondaryButton disabled={!validDate} onClick={() => onAddHotel(hotel, checkIn, nights)}>{t.addToPortfolio}</SecondaryButton>
        <PrimaryButton disabled={!validDate || isProcessing} onClick={() => onBookHotel(hotel, checkIn, nights)}>
          {t.reserve} <span className="tabular">· {formatPkr(total)}</span>
        </PrimaryButton>
      </div>
    </div>
  );
}

function FlightBooking({ flight, t, lang, isProcessing, onBookFlight, onAddFlight }: Props & { flight: Flight }) {
  const [passengers, setPassengers] = useState(1);
  const total = flight.farePerPassenger * passengers;
  const facts = [
    [flight.airline, formatDay(flight.date, lang)],
    [`${flight.from.code} ${flight.departs}`, `${flight.to.code} ${flight.arrives}`],
    [formatDuration(flight.durationMinutes), flight.stops === 0 ? t.nonstop : String(flight.stops)],
    [flight.cabin, fill(t.baggage, { kg: flight.baggage })],
  ];

  return (
    <div>
      <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        {facts.map(([a, b]) => (
          <div key={a}>
            <dt className="text-[var(--text-p)]" dir="ltr">{a}</dt>
            <dd className="text-[13px] text-[var(--text-s)]">{b}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div>
          <span className="mb-2 block text-[13px] font-medium text-[var(--text-p)]">{t.passengers}</span>
          <Stepper value={passengers} min={1} max={LIMITS.passengers} onChange={setPassengers} label={t.passengers} />
        </div>
        <div className="tabular ms-auto text-end">
          <p className="text-[13px] text-[var(--text-s)]">{fill(t.rateTimes, { rate: formatPkr(flight.farePerPassenger), n: passengers })}</p>
          <p className="text-xl font-semibold text-[var(--text-p)]"><AnimatedPkr value={total} /></p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <SecondaryButton onClick={() => onAddFlight(flight, passengers)}>{t.addToPortfolio}</SecondaryButton>
        <PrimaryButton disabled={isProcessing} onClick={() => onBookFlight(flight, passengers)}>
          {t.book} <span className="tabular">· {formatPkr(total)}</span>
        </PrimaryButton>
      </div>
    </div>
  );
}

function DealBooking({ deal, t, isProcessing, onBookDeal }: Props & { deal: TripDeal }) {
  return (
    <div>
      <p className="mt-1 text-sm text-[var(--text-s)]">{deal.description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className={cn("tabular text-xl font-semibold text-[var(--text-p)]")}>{formatPkr(deal.price)}</p>
        <PrimaryButton disabled={isProcessing} onClick={() => onBookDeal(deal)}>{t.book}</PrimaryButton>
      </div>
    </div>
  );
}
