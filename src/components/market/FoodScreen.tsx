/**
 * Order Food: Lahore restaurants as a masonry of cover cards, each menu by section, and a
 * basket that checks the restaurant's minimum order. Adding a dish flies it into the basket.
 * The server prices the order again from its own menu.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Plus, Search, ShoppingBag } from "lucide-react";
import { cn } from "../../lib/utils";
import { findMenuItem, LIMITS, type Restaurant } from "../../../shared/marketplace";
import { covers } from "../../../shared/covers";
import { PrimaryButton, Stepper } from "./parts";
import { AnimatedPkr, LensCover, MotionTabs, PhotoCredits, Ripple } from "./motionParts";
import { cardMotion, fill, formatPkr } from "./helpers";
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

type Flyer = { key: number; src: string; from: DOMRect; to: DOMRect };

export function FoodScreen({ restaurants, basket, setBasket, t, confirm, onPlaceOrder, isProcessing }: Props) {
  const reduce = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showBasket, setShowBasket] = useState(false); // phone only
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const basketTarget = useRef<HTMLHeadingElement>(null);
  const barTarget = useRef<HTMLButtonElement>(null);
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

  // A small copy of the restaurant's photo flies from the Add button into the basket
  const flyFrom = (restaurant: Restaurant, from: DOMRect) => {
    const cover = covers[restaurant.id];
    const target = [basketTarget.current, barTarget.current].find(el => el && el.offsetParent !== null);
    if (reduce || !cover || !target) return;
    setFlyer({ key: Date.now(), src: cover.src, from, to: target.getBoundingClientRect() });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn("min-h-0 overflow-y-auto pe-1 scrollbar-hide", showBasket && "hidden md:block")}>
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.div key={open.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                <MenuView restaurant={open} t={t} onBack={() => setOpenId(null)} quantityOf={quantityOf} setQuantity={setQuantity} onAdded={flyFrom} />
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.25 }}>
                <RestaurantList restaurants={restaurants} query={query} setQuery={setQuery} t={t} onOpen={setOpenId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <aside className={cn("min-h-0 overflow-y-auto md:block", showBasket ? "block" : "hidden")} aria-label={t.basket}>
          {showBasket && (
            <button type="button" onClick={() => setShowBasket(false)} className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-s)] hover:text-[var(--text-p)] md:hidden">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t.menu}
            </button>
          )}
          <BasketPanel
            titleRef={basketTarget}
            restaurant={basketRestaurant}
            lines={lines}
            count={count}
            subtotal={subtotal}
            t={t}
            isProcessing={isProcessing}
            isOpenMenu={!!open && open.id === basketRestaurant?.id}
            onOpenMenu={() => { setOpenId(basketRestaurant!.id); setShowBasket(false); }}
            onQuantity={(itemId, q) => basketRestaurant && setQuantity(basketRestaurant, itemId, q)}
            onPlaceOrder={() => basketRestaurant && onPlaceOrder(basketRestaurant, lines.map(l => ({ id: l.item.id, quantity: l.quantity })))}
          />
        </aside>
      </div>

      {/* Phone: the basket folds into one bar under the menu */}
      <AnimatePresence>
        {count > 0 && !showBasket && (
          <motion.button
            ref={barTarget}
            type="button"
            onClick={() => setShowBasket(true)}
            aria-label={`${t.viewBasket}, ${fill(t.inBasket, { n: count })}`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 flex h-12 flex-none items-center justify-between gap-4 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg)] md:hidden"
          >
            <span className="inline-flex items-center gap-2"><ShoppingBag className="h-4 w-4" /><BumpCount value={count} /> {t.viewBasket}</span>
            <AnimatedPkr value={subtotal + (basketRestaurant?.deliveryFee || 0)} />
          </motion.button>
        )}
      </AnimatePresence>

      {flyer && createPortal(
        <motion.img
          key={flyer.key}
          src={flyer.src}
          alt=""
          aria-hidden
          className="pointer-events-none fixed z-[200] h-12 w-12 rounded-full object-cover shadow-xl ring-2 ring-[var(--accent)]"
          initial={{ left: flyer.from.left + flyer.from.width / 2 - 24, top: flyer.from.top + flyer.from.height / 2 - 24, scale: 1, opacity: 1 }}
          animate={{ left: flyer.to.left + 8, top: flyer.to.top - 12, scale: 0.35, opacity: 0.4 }}
          transition={{ duration: 0.6, ease: [0.45, 0, 0.2, 1] }}
          onAnimationComplete={() => setFlyer(null)}
        />,
        document.body
      )}
    </div>
  );
}

/** A count that pops when it changes */
function BumpCount({ value }: { value: number }) {
  return (
    <motion.span key={value} initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="tabular inline-block">
      {value}
    </motion.span>
  );
}

function RestaurantList({ restaurants, query, setQuery, t, onOpen }: {
  restaurants: Restaurant[]; query: string; setQuery: (q: string) => void; t: MarketLabels; onOpen: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const q = query.trim().toLowerCase();
  const results = restaurants
    .map(r => {
      const dishes = q ? r.menu.flatMap(s => s.items).filter(i => i.name.toLowerCase().includes(q)) : [];
      const matchesPlace = !q || [r.name, r.cuisine, r.area].some(v => v.toLowerCase().includes(q));
      return { r, dishes, show: matchesPlace || dishes.length > 0 };
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

      {/* Pinterest-style masonry: cards keep their photo's own proportions */}
      <div className="mt-4 columns-1 gap-4 sm:columns-2">
        <AnimatePresence initial={false}>
          {results.map(({ r, dishes }, index) => {
            const cover = covers[r.id];
            return (
              <motion.button
                key={r.id}
                type="button"
                layout={!reduce}
                {...cardMotion(index, reduce)}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => onOpen(r.id)}
                className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-[var(--raised)] text-start transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {cover && <LensCover cover={cover} ratio={cover.height / cover.width} className="w-full" lens={110} />}
                <div className="p-4">
                  <p className="text-base font-semibold text-[var(--text-p)]">{r.name}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--text-s)]">{r.cuisine} · {r.area}</p>
                  {dishes.length > 0 && (
                    <p className="mt-2 text-[13px] text-[var(--text-p)]">{fill(t.matches, { items: dishes.slice(0, 3).map(d => d.name).join(", ") })}</p>
                  )}
                  <p className="tabular mt-3 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px]">
                    <span className="whitespace-nowrap text-[var(--text-p)]">{fill(t.minutes, { a: r.deliveryMinutes[0], b: r.deliveryMinutes[1] })}</span>
                    <span className="whitespace-nowrap text-[var(--text-s)]">{t.deliveryFee} {formatPkr(r.deliveryFee)}</span>
                    <span className="whitespace-nowrap text-[var(--text-s)]">{t.minOrder} {formatPkr(r.minOrder)}</span>
                  </p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      {results.length === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-[var(--control)] px-4 py-3 text-sm text-[var(--text-s)]">{fill(t.noMatch, { q: query.trim() })}</p>
      )}
      <PhotoCredits ids={restaurants.map(r => r.id)} t={t} />
    </div>
  );
}

function MenuView({ restaurant, t, onBack, quantityOf, setQuantity, onAdded }: {
  restaurant: Restaurant; t: MarketLabels; onBack: () => void;
  quantityOf: (r: Restaurant, itemId: string) => number; setQuantity: (r: Restaurant, itemId: string, q: number) => void;
  onAdded: (r: Restaurant, from: DOMRect) => void;
}) {
  const [active, setActive] = useState(restaurant.menu[0]?.name);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const cover = covers[restaurant.id];

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

      {cover && <LensCover cover={cover} eager className="mt-4 h-44 w-full rounded-2xl sm:h-52" lens={140} />}

      <div className="mt-4 min-w-0">
        <h3 className="text-xl font-semibold tracking-tight text-[var(--text-p)]">{restaurant.name}</h3>
        <p className="mt-0.5 text-sm text-[var(--text-s)]">{restaurant.cuisine} · {restaurant.area}</p>
        {/* Each fact keeps its label and figure together, so a wrap never strands a separator */}
        <p className="tabular mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[var(--text-p)]">
          <span className="whitespace-nowrap">{fill(t.minutes, { a: restaurant.deliveryMinutes[0], b: restaurant.deliveryMinutes[1] })}</span>
          <span className="whitespace-nowrap"><span className="text-[var(--text-s)]">{t.deliveryFee} </span>{formatPkr(restaurant.deliveryFee)}</span>
          <span className="whitespace-nowrap"><span className="text-[var(--text-s)]">{t.minOrder} </span>{formatPkr(restaurant.minOrder)}</span>
        </p>
      </div>

      <div ref={tabsRef} className="sticky top-0 z-10 mt-5 bg-[var(--card)] pt-1">
        <MotionTabs
          id={`menu-${restaurant.id}`}
          label={t.menu}
          active={active}
          onChange={jumpTo}
          tabs={restaurant.menu.map(s => ({ id: s.name, label: s.name }))}
        />
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
                    <AnimatePresence mode="popLayout" initial={false}>
                      {quantity === 0 ? (
                        <motion.button
                          key="add"
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={e => { setQuantity(restaurant, item.id, 1); onAdded(restaurant, e.currentTarget.getBoundingClientRect()); }}
                          aria-label={`${t.add}: ${item.name}`}
                          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--control)] px-4 text-sm font-medium text-[var(--text-p)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                        >
                          <Plus className="h-4 w-4" /> {t.add}
                        </motion.button>
                      ) : (
                        <motion.div key="stepper" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <Stepper value={quantity} max={LIMITS.dishQuantity} onChange={q => setQuantity(restaurant, item.id, q)} label={item.name} />
                        </motion.div>
                      )}
                    </AnimatePresence>
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

function BasketPanel({ titleRef, restaurant, lines, count, subtotal, t, isProcessing, isOpenMenu, onOpenMenu, onQuantity, onPlaceOrder }: {
  titleRef: React.Ref<HTMLHeadingElement>;
  restaurant: Restaurant | null;
  lines: { item: { id: string; name: string; price: number }; quantity: number }[];
  count: number;
  subtotal: number;
  t: MarketLabels;
  isProcessing: boolean;
  isOpenMenu: boolean;
  onOpenMenu: () => void;
  onQuantity: (itemId: string, quantity: number) => void;
  onPlaceOrder: () => void;
}) {
  const empty = !restaurant || lines.length === 0;
  const fee = restaurant?.deliveryFee || 0;
  const short = restaurant ? Math.max(0, restaurant.minOrder - subtotal) : 0;
  const progress = restaurant ? Math.min(1, subtotal / restaurant.minOrder) : 0;

  return (
    <motion.div layout className="rounded-2xl bg-[var(--raised)] p-5" transition={{ type: "spring", stiffness: 300, damping: 32 }}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 ref={titleRef} className="flex items-center gap-2 text-base font-semibold text-[var(--text-p)]">
          {t.basket}
          {count > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-semibold text-[var(--bg)]"><BumpCount value={count} /></span>
          )}
        </h3>
        {!empty && !isOpenMenu && (
          <button type="button" onClick={onOpenMenu} className="text-sm text-[var(--accent)] hover:underline">{t.openBasketMenu}</button>
        )}
      </div>

      {empty ? (
        <p className="mt-2 text-sm text-[var(--text-s)]">{t.basketEmpty}</p>
      ) : (
        <>
          <p className="mt-0.5 text-sm text-[var(--text-s)]">{fill(t.basketFrom, { name: restaurant!.name })}</p>

          <ul className="mt-4 space-y-3">
            <AnimatePresence initial={false}>
              {lines.map(({ item, quantity }) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 overflow-hidden"
                >
                  <p className="text-sm text-[var(--text-p)]">{item.name}</p>
                  <AnimatedPkr value={item.price * quantity} className="text-end text-sm text-[var(--text-p)]" />
                  <Stepper size="sm" value={quantity} max={LIMITS.dishQuantity} onChange={q => onQuantity(item.id, q)} label={item.name} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <dl className="tabular mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.subtotal}</dt><dd className="text-[var(--text-p)]"><AnimatedPkr value={subtotal} /></dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.deliveryFee}</dt><dd className="text-[var(--text-p)]">{formatPkr(fee)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt className="text-[var(--text-p)]">{t.total}</dt><dd className="text-[var(--text-p)]"><AnimatedPkr value={subtotal + fee} /></dd></div>
          </dl>

          {/* Progress to the restaurant's minimum order, at its true ratio */}
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]" role="progressbar" aria-valuemin={0} aria-valuemax={restaurant!.minOrder} aria-valuenow={Math.min(subtotal, restaurant!.minOrder)} aria-label={t.minOrder}>
              <motion.div className="h-full rounded-full bg-[var(--accent)]" initial={false} animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 160, damping: 24 }} />
            </div>
            <p id="basket-min" className={cn("tabular mt-2 text-[13px]", short ? "text-[var(--text-p)]" : "text-[var(--positive)]")}>
              {short ? fill(t.addMore, { amount: formatPkr(short) }) : t.minReached}
            </p>
            {short > 0 && <p className="tabular text-[13px] text-[var(--text-s)]">{fill(t.minProgress, { have: formatPkr(subtotal), min: formatPkr(restaurant!.minOrder) })}</p>}
          </div>

          <PrimaryButton className="mt-5 w-full" disabled={short > 0 || isProcessing} aria-describedby="basket-min" onClick={onPlaceOrder}>
            {isProcessing ? <Ripple size={22} label={t.placeOrder} /> : <>{t.placeOrder} <span className="tabular">· {formatPkr(subtotal + fee)}</span></>}
          </PrimaryButton>
        </>
      )}
    </motion.div>
  );
}
