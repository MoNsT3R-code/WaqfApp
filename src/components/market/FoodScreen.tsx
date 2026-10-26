/**
 * Order Food: Lahore restaurants, each menu by section, and a basket that checks the
 * restaurant's minimum order. The server prices the order again from its own menu.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, Search, ShoppingBag } from "lucide-react";
import { cn } from "../../lib/utils";
import { findMenuItem, LIMITS, type Restaurant } from "../../../shared/marketplace";
import { Monogram, PrimaryButton, Stepper, fill, formatPkr } from "./parts";
import type { translations } from "../../translations";

export type Basket = { restaurantId: string; items: Record<string, number> } | null;
type MarketLabels = (typeof translations)["en"]["market"];

type Props = {
  restaurants: Restaurant[];
  basket: Basket;
  setBasket: React.Dispatch<React.SetStateAction<Basket>>;
  t: MarketLabels;
  confirm: (message: string, onConfirm: () => void) => void;
  onPlaceOrder: (restaurant: Restaurant, items: { id: string; quantity: number }[]) => void;
  isProcessing: boolean;
};

export function FoodScreen({ restaurants, basket, setBasket, t, confirm, onPlaceOrder, isProcessing }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showBasket, setShowBasket] = useState(false); // phone only
  const open = restaurants.find(r => r.id === openId) || null;

  const basketRestaurant = basket ? restaurants.find(r => r.id === basket.restaurantId) || null : null;
  const lines = useMemo(() => {
    if (!basket || !basketRestaurant) return [];
    return Object.entries(basket.items)
      .map(([id, quantity]) => ({ item: findMenuItem(basketRestaurant, id), quantity }))
      .filter((l): l is { item: NonNullable<typeof l.item>; quantity: number } => !!l.item);
  }, [basket, basketRestaurant]);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = lines.reduce((s, l) => s + l.item.price * l.quantity, 0);

  const quantityOf = (restaurant: Restaurant, itemId: string) =>
    basket?.restaurantId === restaurant.id ? basket.items[itemId] || 0 : 0;

  const setQuantity = (restaurant: Restaurant, itemId: string, quantity: number) => {
    if (basket && basket.restaurantId !== restaurant.id && quantity > 0) {
      confirm(fill(t.replaceBasket, { old: basketRestaurant?.name || "", new: restaurant.name }), () =>
        setBasket({ restaurantId: restaurant.id, items: { [itemId]: quantity } })
      );
      return;
    }
    // Built from the latest basket, so quick taps in a row all count
    setBasket(prev => {
      const items = { ...(prev?.restaurantId === restaurant.id ? prev.items : {}), [itemId]: quantity };
      if (quantity <= 0) delete items[itemId];
      return Object.keys(items).length ? { restaurantId: restaurant.id, items } : null;
    });
  };

  const basketPanel = (
    <BasketPanel
      restaurant={basketRestaurant}
      lines={lines}
      subtotal={subtotal}
      t={t}
      isProcessing={isProcessing}
      isOpenMenu={!!open && open.id === basketRestaurant?.id}
      onOpenMenu={() => { setOpenId(basketRestaurant!.id); setShowBasket(false); }}
      onQuantity={(itemId, q) => basketRestaurant && setQuantity(basketRestaurant, itemId, q)}
      onPlaceOrder={() => basketRestaurant && onPlaceOrder(basketRestaurant, lines.map(l => ({ id: l.item.id, quantity: l.quantity })))}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn("min-h-0 overflow-y-auto pe-1 scrollbar-hide", showBasket && "hidden md:block")}>
          {open ? (
            <MenuView restaurant={open} index={restaurants.indexOf(open)} t={t} onBack={() => setOpenId(null)} quantityOf={quantityOf} setQuantity={setQuantity} />
          ) : (
            <RestaurantList restaurants={restaurants} query={query} setQuery={setQuery} t={t} onOpen={setOpenId} />
          )}
        </div>
        <aside className={cn("min-h-0 overflow-y-auto md:block", showBasket ? "block" : "hidden")} aria-label={t.basket}>
          {showBasket && (
            <button type="button" onClick={() => setShowBasket(false)} className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-s)] hover:text-[var(--text-p)] md:hidden">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t.menu}
            </button>
          )}
          {basketPanel}
        </aside>
      </div>

      {/* Phone: the basket folds into one bar under the menu */}
      {count > 0 && !showBasket && (
        <button
          type="button"
          onClick={() => setShowBasket(true)}
          aria-label={`${t.viewBasket}, ${fill(t.inBasket, { n: count })}`}
          className="mt-4 flex h-12 flex-none items-center justify-between gap-4 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg)] md:hidden"
        >
          <span className="inline-flex items-center gap-2"><ShoppingBag className="h-4 w-4" /><span className="tabular">{count}</span> {t.viewBasket}</span>
          <span className="tabular">{formatPkr(subtotal + (basketRestaurant?.deliveryFee || 0))}</span>
        </button>
      )}
    </div>
  );
}

function RestaurantList({ restaurants, query, setQuery, t, onOpen }: {
  restaurants: Restaurant[]; query: string; setQuery: (q: string) => void; t: MarketLabels; onOpen: (id: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const results = restaurants
    .map((r, index) => {
      const dishes = q ? r.menu.flatMap(s => s.items).filter(i => i.name.toLowerCase().includes(q)) : [];
      const matchesPlace = !q || [r.name, r.cuisine, r.area].some(v => v.toLowerCase().includes(q));
      return { r, index, dishes, show: matchesPlace || dishes.length > 0 };
    })
    .filter(x => x.show);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold text-[var(--text-p)]">{t.restaurantsTitle}</h3>
        <span className="tabular text-sm text-[var(--text-s)]">{fill(t.placesCount, { n: results.length })}</span>
      </div>

      <label className="relative mt-4 block">
        <span className="sr-only">{t.searchFood}</span>
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-s)]" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.searchFood}
          className="h-11 w-full rounded-full border border-[var(--control)] bg-[var(--bg)] ps-10 pe-4 text-sm text-[var(--text-p)] placeholder:text-[var(--text-s)] focus:border-[var(--accent)] focus:outline-none"
        />
      </label>

      <ul className="mt-3">
        {results.map(({ r, index, dishes }) => (
          <li key={r.id} className="border-b border-[var(--border)] last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(r.id)}
              className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-4 rounded-xl px-2 py-4 text-start transition-colors hover:bg-[var(--raised)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <Monogram name={r.name} index={index} image={r.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[var(--text-p)]">{r.name}</p>
                <p className="mt-0.5 truncate text-[13px] text-[var(--text-s)]">{r.cuisine} · {r.area}</p>
                {dishes.length > 0 && (
                  <p className="mt-1 truncate text-[13px] text-[var(--text-p)]">{fill(t.matches, { items: dishes.slice(0, 3).map(d => d.name).join(", ") })}</p>
                )}
                <p className="tabular mt-1 text-[13px] text-[var(--text-s)] sm:hidden">
                  {fill(t.minutes, { a: r.deliveryMinutes[0], b: r.deliveryMinutes[1] })} · {t.deliveryFee} {formatPkr(r.deliveryFee)}
                </p>
              </div>
              <div className="tabular hidden flex-none text-end sm:block">
                <p className="text-sm text-[var(--text-p)]">{fill(t.minutes, { a: r.deliveryMinutes[0], b: r.deliveryMinutes[1] })}</p>
                <p className="mt-0.5 text-[13px] text-[var(--text-s)]">{t.deliveryFee} {formatPkr(r.deliveryFee)}</p>
                <p className="text-[13px] text-[var(--text-s)]">{t.minOrder} {formatPkr(r.minOrder)}</p>
              </div>
              <ChevronRight className="h-4 w-4 flex-none text-[var(--text-s)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </button>
          </li>
        ))}
        {results.length === 0 && (
          <li className="rounded-lg border border-dashed border-[var(--control)] px-4 py-3 text-sm text-[var(--text-s)]">{fill(t.noMatch, { q: query.trim() })}</li>
        )}
      </ul>
    </div>
  );
}

function MenuView({ restaurant, index, t, onBack, quantityOf, setQuantity }: {
  restaurant: Restaurant; index: number; t: MarketLabels; onBack: () => void;
  quantityOf: (r: Restaurant, itemId: string) => number; setQuantity: (r: Restaurant, itemId: string, q: number) => void;
}) {
  const [active, setActive] = useState(restaurant.menu[0]?.name);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  const scroller = () => tabsRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
  // A section's top within the scrolling list (offsetTop would measure from the dialog)
  const topIn = (box: HTMLElement, el: HTMLElement) => el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;

  const jumpTo = (name: string) => {
    const el = sectionRefs.current[name];
    const box = scroller();
    if (!el || !box) return;
    setActive(name);
    box.scrollTo({ top: topIn(box, el) - (tabsRef.current?.offsetHeight || 0) - 8, behavior: "smooth" });
  };

  // The tab follows the section being read
  const onScroll = () => {
    const box = scroller();
    if (!box) return;
    const line = box.scrollTop + (tabsRef.current?.offsetHeight || 0) + 16;
    let current = restaurant.menu[0]?.name;
    for (const section of restaurant.menu) {
      const el = sectionRefs.current[section.name];
      if (el && topIn(box, el) <= line) current = section.name;
    }
    // At the end of the list the last section can't reach the top, so it counts once in view
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 2) current = restaurant.menu[restaurant.menu.length - 1]?.name;
    setActive(current);
  };

  // Each menu opens at its top, and the scroll position drives the active tab
  useEffect(() => {
    const box = scroller();
    if (!box) return;
    box.scrollTop = 0;
    setActive(restaurant.menu[0]?.name);
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => box.removeEventListener("scroll", onScroll);
  }, [restaurant.id]);

  return (
    <div>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full text-sm text-[var(--text-s)] hover:text-[var(--text-p)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t.allRestaurants}
      </button>

      <div className="mt-4 flex items-start gap-4">
        <Monogram name={restaurant.name} index={index} size={56} image={restaurant.image} />
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight text-[var(--text-p)]">{restaurant.name}</h3>
          <p className="mt-0.5 text-sm text-[var(--text-s)]">{restaurant.cuisine} · {restaurant.area}</p>
          {/* Each fact keeps its label and figure together, so a wrap never strands a separator */}
          <p className="tabular mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[var(--text-p)]">
            <span className="whitespace-nowrap">{fill(t.minutes, { a: restaurant.deliveryMinutes[0], b: restaurant.deliveryMinutes[1] })}</span>
            <span className="whitespace-nowrap"><span className="text-[var(--text-s)]">{t.deliveryFee} </span>{formatPkr(restaurant.deliveryFee)}</span>
            <span className="whitespace-nowrap"><span className="text-[var(--text-s)]">{t.minOrder} </span>{formatPkr(restaurant.minOrder)}</span>
          </p>
        </div>
      </div>

      <div ref={tabsRef} className="sticky top-0 z-10 mt-5 bg-[var(--card)] pt-1">
        <div role="tablist" aria-label={t.menu} className="flex gap-6 overflow-x-auto border-b border-[var(--border)] scrollbar-hide">
          {restaurant.menu.map(section => (
            <button
              key={section.name}
              role="tab"
              type="button"
              aria-selected={active === section.name}
              onClick={() => jumpTo(section.name)}
              className={cn(
                "-mb-px flex-none whitespace-nowrap border-b-2 pb-3 text-sm transition-colors",
                active === section.name ? "border-[var(--accent)] font-medium text-[var(--text-p)]" : "border-transparent text-[var(--text-s)] hover:text-[var(--text-p)]"
              )}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>

      {restaurant.menu.map(section => (
        <section key={section.name} ref={el => { sectionRefs.current[section.name] = el; }} className="pt-6" aria-labelledby={`sec-${restaurant.id}-${section.name}`}>
          <h4 id={`sec-${restaurant.id}-${section.name}`} className="text-[15px] font-semibold text-[var(--text-p)]">{section.name}</h4>
          <ul className="mt-1">
            {section.items.map(item => {
              const quantity = quantityOf(restaurant, item.id);
              return (
                <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-[var(--border)] py-3.5 last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-p)]">{item.name}</p>
                    {item.description && <p className="mt-0.5 text-[13px] leading-5 text-[var(--text-s)]">{item.description}</p>}
                    <p className="tabular mt-1 text-sm text-[var(--text-p)]">{formatPkr(item.price)}</p>
                  </div>
                  <div className="flex justify-end">
                    {quantity === 0 ? (
                      <button
                        type="button"
                        onClick={() => setQuantity(restaurant, item.id, 1)}
                        aria-label={`${t.add}: ${item.name}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--control)] px-4 text-sm font-medium text-[var(--text-p)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                      >
                        <Plus className="h-4 w-4" /> {t.add}
                      </button>
                    ) : (
                      <Stepper value={quantity} max={LIMITS.dishQuantity} onChange={q => setQuantity(restaurant, item.id, q)} label={item.name} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function BasketPanel({ restaurant, lines, subtotal, t, isProcessing, isOpenMenu, onOpenMenu, onQuantity, onPlaceOrder }: {
  restaurant: Restaurant | null;
  lines: { item: { id: string; name: string; price: number }; quantity: number }[];
  subtotal: number;
  t: MarketLabels;
  isProcessing: boolean;
  isOpenMenu: boolean;
  onOpenMenu: () => void;
  onQuantity: (itemId: string, quantity: number) => void;
  onPlaceOrder: () => void;
}) {
  if (!restaurant || lines.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--raised)] p-5">
        <h3 className="text-base font-semibold text-[var(--text-p)]">{t.basket}</h3>
        <p className="mt-2 text-sm text-[var(--text-s)]">{t.basketEmpty}</p>
      </div>
    );
  }

  const total = subtotal + restaurant.deliveryFee;
  const short = Math.max(0, restaurant.minOrder - subtotal);
  const progress = Math.min(1, subtotal / restaurant.minOrder);

  return (
    <div className="rounded-2xl bg-[var(--raised)] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text-p)]">{t.basket}</h3>
        {!isOpenMenu && (
          <button type="button" onClick={onOpenMenu} className="text-sm text-[var(--accent)] hover:underline">{t.openBasketMenu}</button>
        )}
      </div>
      <p className="mt-0.5 text-sm text-[var(--text-s)]">{fill(t.basketFrom, { name: restaurant.name })}</p>

      <ul className="mt-4 space-y-3">
        {lines.map(({ item, quantity }) => (
          <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
            <p className="text-sm text-[var(--text-p)]">{item.name}</p>
            <p className="tabular text-end text-sm text-[var(--text-p)]">{formatPkr(item.price * quantity)}</p>
            <Stepper size="sm" value={quantity} max={LIMITS.dishQuantity} onChange={q => onQuantity(item.id, q)} label={item.name} />
          </li>
        ))}
      </ul>

      <dl className="tabular mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.subtotal}</dt><dd className="text-[var(--text-p)]">{formatPkr(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.deliveryFee}</dt><dd className="text-[var(--text-p)]">{formatPkr(restaurant.deliveryFee)}</dd></div>
        <div className="flex justify-between text-base font-semibold"><dt className="text-[var(--text-p)]">{t.total}</dt><dd className="text-[var(--text-p)]">{formatPkr(total)}</dd></div>
      </dl>

      {/* Progress to the restaurant's minimum order, at its true ratio */}
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]" role="progressbar" aria-valuemin={0} aria-valuemax={restaurant.minOrder} aria-valuenow={Math.min(subtotal, restaurant.minOrder)} aria-label={t.minOrder}>
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progress * 100}%` }} />
        </div>
        <p id="basket-min" className={cn("tabular mt-2 text-[13px]", short ? "text-[var(--text-p)]" : "text-[var(--positive)]")}>
          {short ? fill(t.addMore, { amount: formatPkr(short) }) : t.minReached}
        </p>
        {short > 0 && <p className="tabular text-[13px] text-[var(--text-s)]">{fill(t.minProgress, { have: formatPkr(subtotal), min: formatPkr(restaurant.minOrder) })}</p>}
      </div>

      <PrimaryButton className="mt-5 w-full" disabled={short > 0 || isProcessing} aria-describedby="basket-min" onClick={onPlaceOrder}>
        {isProcessing ? "…" : <>{t.placeOrder} <span className="tabular">· {formatPkr(total)}</span></>}
      </PrimaryButton>
    </div>
  );
}
