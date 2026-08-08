/* =============================================
   Gallery — Hover zoom-to-foreground
   Shared across all project pages
   ============================================= */

(function () {
  'use strict';

  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const DURATION_IN  = '0.35s';
  const DURATION_OUT = '0.28s';

  // Signature accent green — always vivid against dark frames, light pages
  // and the dark zoom backdrop alike, so it never washes out either theme.
  const GLOW_RGB = '0,230,118';
  function getHoverGlow() {
    return `0 0 0 1px rgba(${GLOW_RGB},0.45), 0 0 20px 5px rgba(${GLOW_RGB},0.24)`;
  }

  let activeClone    = null;
  let activeBackdrop = null;
  let activeOrigin   = null;
  let activeCaption  = null;

  /* --------------------------------------------------
     Caption extraction
  -------------------------------------------------- */
  function getCaption(img) {
    const parent = img.closest('.gallery-item');
    if (parent) {
      const cap = parent.querySelector('.gallery-caption');
      if (cap) return cap.textContent.trim();
    }
    const frame = img.closest('.img-frame');
    if (frame) {
      const cap = frame.nextElementSibling;
      if (cap && cap.classList.contains('img-caption')) return cap.textContent.trim();
    }
    const next = img.nextElementSibling;
    if (next && next.classList.contains('img-caption')) return next.textContent.trim();
    const card = img.closest('.viz-card');
    if (card) {
      const lbl = card.querySelector('.viz-card-label');
      if (lbl) return lbl.textContent.trim();
    }
    return img.alt || '';
  }

  /* --------------------------------------------------
     Open: clone flies from thumbnail to center
  -------------------------------------------------- */
  function openZoom(img) {
    if (activeClone) return;

    const rect = img.getBoundingClientRect();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed; inset: 0; z-index: 9998;
      background: rgba(0,0,0,0);
      transition: background ${DURATION_IN} ${EASING};
      pointer-events: none;
    `;
    document.body.appendChild(backdrop);

    // Clone positioned exactly over the original
    const clone = document.createElement('img');
    clone.src = img.src;
    clone.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      object-fit: contain;
      z-index: 9999;
      border-radius: 4px;
      box-shadow: none;
      transition:
        left   ${DURATION_IN} ${EASING},
        top    ${DURATION_IN} ${EASING},
        width  ${DURATION_IN} ${EASING},
        height ${DURATION_IN} ${EASING},
        box-shadow ${DURATION_IN} ${EASING};
      cursor: zoom-out;
      pointer-events: auto;
    `;
    document.body.appendChild(clone);

    // Caption label
    const caption = document.createElement('p');
    caption.textContent = getCaption(img);
    caption.style.cssText = `
      position: fixed;
      z-index: 9999;
      left: 0; right: 0;
      top: ${rect.top + rect.height + 14}px;
      width: fit-content;
      max-width: calc(100% - 80px);
      margin: 0 auto;
      text-align: center;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      color: rgba(232,232,232,0);
      letter-spacing: 0.02em;
      line-height: 1.5;
      padding: 8px 22px;
      border-radius: 999px;
      background: rgba(0,0,0,0);
      border: 1px solid rgba(${GLOW_RGB},0);
      pointer-events: none;
      transition: color ${DURATION_IN} ${EASING}, top ${DURATION_IN} ${EASING}, background ${DURATION_IN} ${EASING}, border-color ${DURATION_IN} ${EASING};
    `;
    document.body.appendChild(caption);

    // Hide original while clone is live
    img.style.visibility = 'hidden';

    activeClone    = clone;
    activeBackdrop = backdrop;
    activeOrigin   = img;
    activeCaption  = caption;

    // Animate to center on next frame
    requestAnimationFrame(() => {
      const maxW  = window.innerWidth  * 0.82;
      const maxH  = window.innerHeight * 0.82;
      const scale = Math.min(maxW / rect.width, maxH / rect.height, 3);
      const newW  = rect.width  * scale;
      const newH  = rect.height * scale;
      const newL  = (window.innerWidth  - newW) / 2;
      const newT  = (window.innerHeight - newH) / 2;

      clone.style.left      = newL + 'px';
      clone.style.top       = newT + 'px';
      clone.style.width     = newW + 'px';
      clone.style.height    = newH + 'px';
      clone.style.boxShadow = 'none';
      backdrop.style.background = 'rgba(0,0,0,0.55)';
      backdrop.style.pointerEvents = 'auto';

      // Position caption just below the zoomed image and fade it in
      const capTop = newT + newH + 14;
      caption.style.top        = capTop + 'px';
      caption.style.color      = 'rgba(232,232,232,1)';
      caption.style.background = 'rgba(0,0,0,1)';
      caption.style.borderColor = `rgba(${GLOW_RGB},0.4)`;
    });

    // Close on click (clone or backdrop) or Escape
    clone.addEventListener('click', closeZoom);
    backdrop.addEventListener('click', closeZoom);
    document.addEventListener('keydown', onKeyDown);
  }

  /* --------------------------------------------------
     Close: clone flies back to thumbnail
  -------------------------------------------------- */
  function closeZoom() {
    if (!activeClone || !activeOrigin) return;

    const clone    = activeClone;
    const backdrop = activeBackdrop;
    const origin   = activeOrigin;
    const caption  = activeCaption;

    activeClone = activeBackdrop = activeOrigin = activeCaption = null;

    clone.removeEventListener('click', closeZoom);
    backdrop.removeEventListener('click', closeZoom);
    document.removeEventListener('keydown', onKeyDown);

    const rect = origin.getBoundingClientRect();

    clone.style.transition = `
      left   ${DURATION_OUT} ${EASING},
      top    ${DURATION_OUT} ${EASING},
      width  ${DURATION_OUT} ${EASING},
      height ${DURATION_OUT} ${EASING},
      box-shadow ${DURATION_OUT} ${EASING}
    `;
    backdrop.style.transition = `background ${DURATION_OUT} ${EASING}`;

    clone.style.left      = rect.left + 'px';
    clone.style.top       = rect.top  + 'px';
    clone.style.width     = rect.width  + 'px';
    clone.style.height    = rect.height + 'px';
    clone.style.boxShadow = 'none';
    backdrop.style.background = 'rgba(0,0,0,0)';

    // Fade caption out and slide it back down toward the origin
    if (caption) {
      caption.style.transition = `color ${DURATION_OUT} ${EASING}, top ${DURATION_OUT} ${EASING}, background ${DURATION_OUT} ${EASING}, border-color ${DURATION_OUT} ${EASING}`;
      caption.style.top        = (rect.top + rect.height + 14) + 'px';
      caption.style.color      = 'rgba(232,232,232,0)';
      caption.style.background = 'rgba(0,0,0,0)';
      caption.style.borderColor = `rgba(${GLOW_RGB},0)`;
    }

    const ms = parseFloat(DURATION_OUT) * 1000;
    setTimeout(() => {
      clone.remove();
      backdrop.remove();
      if (caption) caption.remove();
      origin.style.visibility = '';
    }, ms + 50);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closeZoom();
  }

  /* --------------------------------------------------
     Attach to all images
  -------------------------------------------------- */
  const HOVER_IN  = 'transform 0.2s ease, box-shadow 0.2s ease';
  const HOVER_OUT = 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s cubic-bezier(0.22,1,0.36,1)';

  function setup() {
    document.querySelectorAll('main img').forEach(img => {
      img.style.cursor  = 'zoom-in';
      img.style.display = 'block';

      img.addEventListener('mouseenter', () => {
        // Lift overflow:hidden on parent so scale doesn't get clipped —
        // but only when the image is the sole occupant of its frame.
        // Cards that also hold a caption (e.g. .viz-card-label) must keep
        // clipping, otherwise the scaled image bleeds over that text.
        const parent = img.parentElement;
        if (parent && parent.children.length === 1) {
          parent._prevOverflow = parent.style.overflow;
          parent._prevZIndex   = parent.style.zIndex;
          parent.style.overflow = 'visible';
          parent.style.zIndex   = '10';
        }
        img.style.transition = HOVER_IN;
        img.style.transform  = 'scale(1.03)';
        img.style.boxShadow  = getHoverGlow();
      });
      img.addEventListener('mouseleave', () => {
        const parent = img.parentElement;
        if (parent) {
          parent.style.overflow = parent._prevOverflow || '';
          parent.style.zIndex   = parent._prevZIndex   || '';
        }
        img.style.transition = HOVER_OUT;
        img.style.transform  = '';
        img.style.boxShadow  = '';
      });
      img.addEventListener('click', () => openZoom(img));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

})();
