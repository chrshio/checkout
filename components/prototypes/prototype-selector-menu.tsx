"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { projects, type PrototypeItem } from "@/lib/prototypes-config";

const VARIANT_SELECTOR_MIN_HEIGHT = 950;

function variantShortLabel(item: PrototypeItem): string {
  const map: Record<string, string> = {
    cafe: "Standard",
    "deferred-modifiers-off": "Deferred: Off",
    "variant-a": "Variant A",
    qsr: "QSR",
    fsr: "FSR",
    retail: "Retail",
    voice: "Voice",
    main: "POS",
    web: "Dashboard",
  };
  return map[item.id] ?? item.name;
}

export function PrototypeSelectorMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showVariantSelector, setShowVariantSelector] = useState(true);
  const variantBarRef = useRef<HTMLDivElement | null>(null);
  const variantButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const leftButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [leftPillStyle, setLeftPillStyle] = useState<{ top: number; height: number; left: number; width: number } | null>(null);
  const [leftHoverIndex, setLeftHoverIndex] = useState<number | null>(null);
  const [leftHoverPillStyle, setLeftHoverPillStyle] = useState<{ top: number; height: number; left: number; width: number } | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(min-height: ${VARIANT_SELECTOR_MIN_HEIGHT}px)`);
    const handleChange = (e: MediaQueryListEvent) => setShowVariantSelector(e.matches);
    setShowVariantSelector(mq.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const pathParts = pathname.replace(/^\/prototypes\/?/, "").split("/").filter(Boolean);
  const currentProjectId = pathParts[0] ?? null;
  const currentVariantId = pathParts[1] ?? pathParts[0] ?? null;
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const hasVariantSelector = currentProject && currentProject.prototypes.length > 1;
  const selectedIndex = hasVariantSelector
    ? currentProject!.prototypes.findIndex((p) => p.id === currentVariantId)
    : -1;

  useLayoutEffect(() => {
    if (!hasVariantSelector || selectedIndex < 0) {
      setPillStyle(null);
      return;
    }
    const bar = variantBarRef.current;
    const button = variantButtonRefs.current[selectedIndex];
    if (!bar || !button) {
      return;
    }
    const barRect = bar.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    setPillStyle({
      left: buttonRect.left - barRect.left,
      width: buttonRect.width,
    });
  }, [hasVariantSelector, selectedIndex, currentVariantId]);

  useEffect(() => {
    if (!hasVariantSelector) return;
    const bar = variantBarRef.current;
    if (!bar) return;
    const ro = new ResizeObserver(() => {
      const idx = currentProject!.prototypes.findIndex((p) => p.id === currentVariantId);
      if (idx < 0) return;
      const button = variantButtonRefs.current[idx];
      if (!button) return;
      const barRect = bar.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setPillStyle({ left: buttonRect.left - barRect.left, width: buttonRect.width });
    });
    ro.observe(bar);
    return () => ro.disconnect();
  }, [hasVariantSelector, currentProject, currentVariantId]);

  const selectedProjectIndex = projects.findIndex((p) => p.id === currentProjectId);

  useLayoutEffect(() => {
    if (selectedProjectIndex < 0) {
      setLeftPillStyle(null);
      return;
    }
    const panel = leftPanelRef.current;
    const button = leftButtonRefs.current[selectedProjectIndex];
    if (!panel || !button) return;
    const panelRect = panel.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    setLeftPillStyle({
      top: buttonRect.top - panelRect.top,
      height: buttonRect.height,
      left: buttonRect.left - panelRect.left,
      width: buttonRect.width,
    });
  }, [selectedProjectIndex, currentProjectId]);

  useEffect(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    const ro = new ResizeObserver(() => {
      if (selectedProjectIndex < 0) return;
      const button = leftButtonRefs.current[selectedProjectIndex];
      if (!button) return;
      const panelRect = panel.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setLeftPillStyle({
        top: buttonRect.top - panelRect.top,
        height: buttonRect.height,
        left: buttonRect.left - panelRect.left,
        width: buttonRect.width,
      });
    });
    ro.observe(panel);
    return () => ro.disconnect();
  }, [selectedProjectIndex, currentProjectId]);

  useLayoutEffect(() => {
    if (leftHoverIndex === null) {
      setLeftHoverPillStyle(null);
      return;
    }
    const panel = leftPanelRef.current;
    const button = leftButtonRefs.current[leftHoverIndex];
    if (!panel || !button) return;
    const panelRect = panel.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    setLeftHoverPillStyle({
      top: buttonRect.top - panelRect.top,
      height: buttonRect.height,
      left: buttonRect.left - panelRect.left,
      width: buttonRect.width,
    });
  }, [leftHoverIndex]);

  const variantSelectorBar = hasVariantSelector ? (
    <div className="flex w-full min-w-0 justify-center px-4 pt-6 pb-1 -mb-24 z-10 relative sm:px-6 md:px-8">
      {/* Scroll when viewport is narrow; bar grows to fit all pills up to available width */}
      <div className="max-w-full min-w-0 overflow-x-auto overflow-y-visible">
        <div
          ref={variantBarRef}
          data-variant-selector-bar
          className="grid h-11 w-max max-w-none items-center gap-1 rounded-full border-[1.4px] border-white/20 overflow-visible p-1 relative mx-auto"
          style={{ gridAutoFlow: "column", gridAutoColumns: "max-content" }}
        >
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(50px)",
            WebkitBackdropFilter: "blur(50px)",
          }}
        />
        {pillStyle && (
          <div
            className="absolute top-1 h-9 rounded-full pointer-events-none transition-[left,width] duration-200 ease-out"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
              background: "rgba(255, 255, 255, 0.08)",
            }}
          />
        )}
        {currentProject!.prototypes.map((p, i) => {
          const isSelected = p.id === currentVariantId;
          const label = variantShortLabel(p);
          const paddingX = 8;
          return (
            <button
              key={p.id}
              ref={(el) => {
                variantButtonRefs.current[i] = el;
              }}
              type="button"
              onClick={() => p.ready && router.push(p.path)}
              disabled={!p.ready}
              style={{
                width: "max-content",
                minWidth: 60,
                paddingLeft: paddingX,
                paddingRight: paddingX,
              }}
              className={cn(
                "relative flex cursor-pointer items-center justify-center h-9 rounded-full text-[13px] leading-4 overflow-hidden transition-colors",
                isSelected ? "text-white" : "text-white/60",
                !p.ready && "cursor-not-allowed opacity-60"
              )}
            >
              <span className="relative whitespace-nowrap">{label}</span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="h-screen overflow-hidden relative flex flex-col bg-[#1a1a1a]">
      {/* Top-left: Portfolio credit — z-30 so above variant bar (z-10) and clickable */}
      <div className="absolute left-4 top-4 z-30 text-xs text-white/40 sm:left-6 sm:top-6 md:left-8 md:top-8">
        Design prototypes generated with AI. <br />
        For the portfolio walkthrough, go{" "}
        <a
          href="https://www.figma.com/deck/Z93Kg5O9XsrqamdSS9Em6I"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/60"
        >
          here
        </a>
        .
      </div>

      {/* Top: Variant selector – in flow when height >= 950px; when height < 950px, hover top edge to reveal */}
      {showVariantSelector && hasVariantSelector ? (
        <div className="flex-shrink-0 relative">{variantSelectorBar}</div>
      ) : hasVariantSelector ? (
        <div className="absolute left-0 right-0 top-0 z-40 group min-h-[88px]">
          {/* Trigger: hover near top edge to reveal variant selector */}
          <div className="absolute left-0 right-0 top-0 h-14" aria-hidden />
          <div
            className={cn(
              "absolute left-0 right-0 top-0 flex justify-center pt-2 transition-opacity duration-200",
              "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            )}
          >
            {variantSelectorBar}
          </div>
        </div>
      ) : null}

      {/* Content area — z-0 so the left prototype selector (z-40) stays on top when sheets/dialogs open inside children */}
      <div className="flex-1 min-h-0 relative z-0 overflow-hidden">
        {children}
      </div>

      {/* Left: Prototype switcher – hidden below 1400px; pops up when cursor at left edge */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 z-40 w-[220px] overflow-visible pointer-events-none",
          "group"
        )}
      >
        {/* Trigger zone at left edge – hover to reveal panel on narrow screens; only this strip receives events when panel is hidden */}
        <div
          className="absolute left-0 top-0 bottom-0 w-5 min-[1400px]:hidden pointer-events-auto"
          aria-hidden
        />
        {/* Bridge: when panel is revealed (group-hover), this fills the strip so moving from trigger to panel doesn't lose hover */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[220px] min-[1400px]:hidden pointer-events-none max-[1399px]:group-hover:pointer-events-auto"
          aria-hidden
        />
        <div
          ref={leftPanelRef}
          onMouseLeave={() => setLeftHoverIndex(null)}
          className={cn(
            "absolute left-6 top-1/2 -translate-y-1/2 z-50 w-fit rounded-[16px] border-[1.4px] border-[rgba(80,80,80,0.22)] overflow-hidden p-1 flex flex-col gap-2",
            "min-[1400px]:opacity-100 min-[1400px]:pointer-events-auto",
            "max-[1399px]:opacity-0 max-[1399px]:pointer-events-none max-[1399px]:transition-opacity max-[1399px]:duration-200",
            "max-[1399px]:group-hover:opacity-100 max-[1399px]:group-hover:pointer-events-auto"
          )}
        >
          {/* Glass backdrop – frosted blur */}
          <div
            className="absolute inset-0 z-0 rounded-[16px] pointer-events-none"
            style={{
              background: "rgba(50, 50, 50, 0.45)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          />
          {leftPillStyle && (
            <div
              className="absolute rounded-lg pointer-events-none transition-[top,height,left,width] duration-200 ease-out"
              style={{
                top: leftPillStyle.top,
                height: leftPillStyle.height,
                left: leftPillStyle.left,
                width: leftPillStyle.width,
                background: "rgba(255, 255, 255, 0.2)",
              }}
            />
          )}
          {leftHoverPillStyle && leftHoverIndex !== selectedProjectIndex && (
            <div
              className="absolute rounded-lg pointer-events-none transition-[top,height,left,width] duration-200 ease-out"
              style={{
                top: leftHoverPillStyle.top,
                height: leftHoverPillStyle.height,
                left: leftHoverPillStyle.left,
                width: leftHoverPillStyle.width,
                background: "rgba(255, 255, 255, 0.1)",
              }}
            />
          )}
          {projects.map((project, i) => {
            const isSelected = project.id === currentProjectId;
            const first = project.prototypes.find((p) => p.ready) ?? project.prototypes[0];
            return (
              <button
                key={project.id}
                ref={(el) => {
                  leftButtonRefs.current[i] = el;
                }}
                type="button"
                onClick={() => first && router.push(first.path)}
                onMouseEnter={() => setLeftHoverIndex(i)}
                onMouseLeave={() => setLeftHoverIndex(null)}
                className={cn(
                  "relative z-10 flex w-[150px] cursor-pointer items-center justify-center rounded-lg py-2.5 pr-7 pl-4 text-left text-[19px] leading-6 overflow-hidden transition-colors",
                  isSelected ? "text-[rgba(255,255,255,0.96)]" : "text-[#545454]"
                )}
              >
                <span className="relative font-medium text-[14px]">{project.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
