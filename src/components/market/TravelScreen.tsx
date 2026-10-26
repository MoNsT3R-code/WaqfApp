/**
 * Travel: Lahore hotels (rate × nights), flights from Lahore (fare × passengers) and trip
 * deals. Totals are shown before anything is booked; the server prices the booking again.
 */
import { useState } from "react";
import { LIMITS, type Flight, type Hotel, type TripDeal } from "../../../shared/marketplace";
import { cn } from "../../lib/utils";
import { Monogram, PrimaryButton, SecondaryButton, Stepper, Tabs, fill, formatDay, formatDuration, formatPkr } from "./parts";
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

export const countLabel = (t: MarketLabels, n: number, unit: "night" | "passenger") =>
  unit === "night"
    ? (n === 1 ? t.nightCount : fill(t.nightsCount, { n }))
    : (n === 1 ? t.passengerCount : fill(t.passengersCount, { n }));

export function TravelScreen(props: Props) {
  const { hotels, flights, packages, tab, setTab, t } = props;
  const titles: Record<TravelTab, string> = { Hotels: t.hotelsTitle, Flights: t.flightsTitle, Packages: t.dealsTitle };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs
        label={t.hotelsTitle}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "Hotels", label: t.hotels, count: hotels.length },
          { id: "Flights", label: t.flights, count: flights.length },
          { id: "Packages", label: t.deals, count: packages.length },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pe-1 pt-5 scrollbar-hide">
        <h3 className="text-base font-semibold text-[var(--text-p)]">{titles[tab]}</h3>
        {tab === "Hotels" && <HotelList {...props} />}
        {tab === "Flights" && <FlightList {...props} />}
        {tab === "Packages" && <DealList {...props} />}
      </div>
    </div>
  );
}

function HotelList({ hotels, t, isProcessing, onBookHotel, onAddHotel }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(tomorrow());
  const [nights, setNights] = useState(1);

  return (
    <ul className="mt-2">
      {hotels.map((hotel, index) => {
        const isOpen = selected === hotel.id;
        const total = hotel.pricePerNight * nights;
        const validDate = checkIn >= today();
        return (
          <li key={hotel.id} className="border-b border-[var(--border)] last:border-b-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => { setSelected(isOpen ? null : hotel.id); setNights(1); setCheckIn(tomorrow()); }}
              className={cn("-mx-2 flex w-[calc(100%+1rem)] items-center gap-4 rounded-xl px-2 py-4 text-start transition-colors hover:bg-[var(--raised)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]", isOpen && "bg-[var(--raised)]")}
            >
              <Monogram name={hotel.name} index={index} image={hotel.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[var(--text-p)]">{hotel.name}</p>
                <p className="mt-0.5 truncate text-[13px] text-[var(--text-s)]">{hotel.area} · {hotel.room}</p>
              </div>
              <div className="tabular flex-none text-end">
                <p className="text-[15px] font-medium text-[var(--text-p)]">{formatPkr(hotel.pricePerNight)}</p>
                <p className="text-[13px] text-[var(--text-s)]">{t.perNight}</p>
              </div>
            </button>

            {isOpen && (
              <div className="mb-4 rounded-xl bg-[var(--raised)] p-4">
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
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
                    <p className="text-lg font-semibold text-[var(--text-p)]">{formatPkr(total)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <SecondaryButton disabled={!validDate} onClick={() => onAddHotel(hotel, checkIn, nights)}>{t.addToPortfolio}</SecondaryButton>
                  <PrimaryButton disabled={!validDate || isProcessing} onClick={() => onBookHotel(hotel, checkIn, nights)}>
                    {t.reserve} <span className="tabular">· {formatPkr(total)}</span>
                  </PrimaryButton>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FlightList({ flights, t, lang, isProcessing, onBookFlight, onAddFlight }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [passengers, setPassengers] = useState(1);

  return (
    <ul className="mt-2">
      {flights.map(flight => {
        const isOpen = selected === flight.id;
        const total = flight.farePerPassenger * passengers;
        const facts = `${formatDuration(flight.durationMinutes)} · ${flight.stops === 0 ? t.nonstop : flight.stops} · ${flight.cabin} · ${fill(t.baggage, { kg: flight.baggage })}`;
        return (
          <li key={flight.id} className="border-b border-[var(--border)] last:border-b-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => { setSelected(isOpen ? null : flight.id); setPassengers(1); }}
              className={cn("-mx-2 grid w-[calc(100%+1rem)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-xl px-2 py-4 text-start transition-colors hover:bg-[var(--raised)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]", isOpen && "bg-[var(--raised)]")}
            >
              <div className="min-w-0">
                <p className="text-[13px] text-[var(--text-s)]">{formatDay(flight.date, lang)}</p>
                <p className="tabular text-[15px] font-medium text-[var(--text-p)]" dir="ltr">{flight.departs} → {flight.arrives}</p>
                <p className="truncate text-[13px] text-[var(--text-s)]">{flight.from.city} {flight.from.code} → {flight.to.city} {flight.to.code}</p>
                <p className="mt-1 truncate text-[13px] text-[var(--text-s)] sm:hidden">{flight.airline} · {facts}</p>
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm text-[var(--text-p)]">{flight.airline}</p>
                <p className="truncate text-[13px] text-[var(--text-s)]">{formatDuration(flight.durationMinutes)} · {flight.stops === 0 ? t.nonstop : flight.stops}</p>
                <p className="truncate text-[13px] text-[var(--text-s)]">{flight.cabin} · {fill(t.baggage, { kg: flight.baggage })}</p>
              </div>
              <div className="tabular text-end">
                <p className="text-[15px] font-medium text-[var(--text-p)]">{formatPkr(flight.farePerPassenger)}</p>
                <p className="text-[13px] text-[var(--text-s)]">{t.perPassenger}</p>
              </div>
            </button>

            {isOpen && (
              <div className="mb-4 rounded-xl bg-[var(--raised)] p-4">
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                  <div>
                    <span className="mb-2 block text-[13px] font-medium text-[var(--text-p)]">{t.passengers}</span>
                    <Stepper value={passengers} min={1} max={LIMITS.passengers} onChange={setPassengers} label={t.passengers} />
                  </div>
                  <div className="tabular ms-auto text-end">
                    <p className="text-[13px] text-[var(--text-s)]">{fill(t.rateTimes, { rate: formatPkr(flight.farePerPassenger), n: passengers })}</p>
                    <p className="text-lg font-semibold text-[var(--text-p)]">{formatPkr(total)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <SecondaryButton onClick={() => onAddFlight(flight, passengers)}>{t.addToPortfolio}</SecondaryButton>
                  <PrimaryButton disabled={isProcessing} onClick={() => onBookFlight(flight, passengers)}>
                    {t.book} <span className="tabular">· {formatPkr(total)}</span>
                  </PrimaryButton>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DealList({ packages, t, isProcessing, onBookDeal }: Props) {
  return (
    <ul className="mt-2">
      {packages.map((deal, index) => (
        <li key={deal.id} className="flex items-center gap-4 border-b border-[var(--border)] py-4 last:border-b-0">
          <Monogram name={deal.name} index={index + 2} image={deal.image} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-[var(--text-p)]">{deal.name}</p>
            <p className="mt-0.5 text-[13px] text-[var(--text-s)]">{deal.description}</p>
          </div>
          <div className="flex flex-none flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="tabular text-[15px] font-medium text-[var(--text-p)]">{formatPkr(deal.price)}</p>
            <SecondaryButton className="h-10" disabled={isProcessing} onClick={() => onBookDeal(deal)}>{t.book}</SecondaryButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
