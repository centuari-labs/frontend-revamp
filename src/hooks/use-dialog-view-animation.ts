import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

/**
 * Animates a two-view dialog transition using GSAP.
 * Slides out the inactive view and slides in the active view.
 */
export function useDialogViewAnimation(
	primaryRef: RefObject<HTMLDivElement | null>,
	secondaryRef: RefObject<HTMLDivElement | null>,
	isPrimaryView: boolean,
) {
	useEffect(() => {
		const primary = primaryRef.current;
		const secondary = secondaryRef.current;
		if (!primary || !secondary) return;

		const tl = gsap.timeline();

		if (isPrimaryView) {
			tl.to(secondary, {
				x: 100,
				opacity: 0,
				duration: 0.3,
				ease: "power2.in",
			}).fromTo(
				primary,
				{ x: -100, opacity: 0 },
				{ x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
				"-=0.15",
			);
		} else {
			tl.to(primary, {
				x: -100,
				opacity: 0,
				duration: 0.3,
				ease: "power2.in",
			}).fromTo(
				secondary,
				{ x: 100, opacity: 0 },
				{ x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
				"-=0.15",
			);
		}
	}, [isPrimaryView, primaryRef, secondaryRef]);
}
