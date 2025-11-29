// Zapisz pozycję scrolla przed odświeżeniem
window.addEventListener('beforeunload', function() {
    sessionStorage.setItem('scrollPosition', window.pageYOffset || document.documentElement.scrollTop);
});

// Przywróć pozycję scrolla po załadowaniu strony
window.addEventListener('load', function() {
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition !== null) {
        // Opóźnienie, aby upewnić się, że strona jest w pełni załadowana
        setTimeout(function() {
            window.scrollTo(0, parseInt(scrollPosition));
            sessionStorage.removeItem('scrollPosition');
        }, 100);
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // Animacja wejścia przycisków w hero
    const heroButtons = document.querySelector('.hero-buttons');
    if (heroButtons) {
        setTimeout(() => {
            heroButtons.classList.add('animated');
        }, 1000); // 1s delay - po paragrafie
    }

    const statNumbers = document.querySelectorAll('.stat-item .number');
    const statsGridEl = document.querySelector('.stats-grid');
    const targetValues = [5000, 100, 15, 0];
    const suffixes = ['+', '+', '+', '/7'];

    const numberObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const index = Array.from(statNumbers).indexOf(target);
                const finalNumber = targetValues[index];
                const suffix = suffixes[index];

                if (finalNumber > 0) {
                    animateNumber(target, finalNumber, suffix);
                }
                numberObserver.unobserve(target);
            }
        });
    });

    function animateNumber(element, finalNumber, suffix, onDone) {
        setTimeout(() => {
            const startNumber = finalNumber === 5000 ? 100 : 0;
            const duration = 1000;
            const steps = 80;
            const stepTime = duration / steps;
            let step = 0;

            const timer = setInterval(() => {
                step++;
                const progress = step / steps;
                const easedProgress = 1 - Math.pow(1 - progress, 4);
                const currentNumber = startNumber + (easedProgress * (finalNumber - startNumber));

                if (step >= steps) {
                    element.textContent = finalNumber + suffix;
                    clearInterval(timer);
                    if (typeof onDone === 'function') onDone();
                } else {
                    element.textContent = Math.floor(currentNumber) + suffix;
                }
            }, stepTime);
        }, 1200);
    }

    const statItems = document.querySelectorAll('.stat-item');
    if (statItems.length) {
        statItems.forEach(item => {
            const w = item.closest('.stat-wrapper');
            if (w) w.classList.add('no-hover');
        });
        const itemObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        statItems.forEach(el => itemObserver.observe(el));
    }

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        let headerShown = false;
        let cardsShown = false;

        const headerObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!headerShown && entry.isIntersecting) {
                    const h2 = statsSection.querySelector('h2');
                    if (h2) h2.classList.add('in-view');
                    headerShown = true;
                    obs.unobserve(statsSection);
                }
            });
        }, { threshold: 0.15 });
        headerObserver.observe(statsSection);

        const cardsObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!cardsShown && entry.isIntersecting) {
                    statItems.forEach(el => el.classList.add('in-view'));
                    if (statsGridEl) statsGridEl.classList.add('no-hover');
                    let appearedCount = 0;
                    const wrappers = document.querySelectorAll('.stat-wrapper');
                    const totalWrappers = wrappers.length;
                    wrappers.forEach(wrap => {
                        const itemEl = wrap.querySelector('.stat-item');
                        if (!itemEl) return;
                        const onAnimEnd = () => {
                            wrap.classList.remove('no-hover');
                            appearedCount += 1;
                            itemEl.removeEventListener('animationend', onAnimEnd);
                            if (appearedCount >= totalWrappers && statsGridEl) {
                                statsGridEl.classList.remove('no-hover');
                            }
                        };
                        itemEl.addEventListener('animationend', onAnimEnd, { once: true });
                    });
                    statNumbers.forEach(stat => numberObserver.observe(stat));
                    cardsShown = true;
                    obs.unobserve(statsSection);
                }
            });
        }, { threshold: 0.4 });
        cardsObserver.observe(statsSection);
    }

    // Animacje wejścia dla sekcji about
    const aboutSection = document.querySelector('.about-section');
    if (aboutSection) {
        const aboutQuote = aboutSection.querySelector('.about-quote');
        const aboutText = aboutSection.querySelector('.about-text');

        const aboutObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (aboutQuote) {
                        aboutQuote.classList.add('in-view');
                    }
                    if (aboutText) {
                        aboutText.classList.add('in-view');
                    }
                    obs.unobserve(aboutSection);
                }
            });
        }, { threshold: 0.2 });

        aboutObserver.observe(aboutSection);
    }

    (function initDividerParallax() {
        const section = document.querySelector('.divider-section');
        const root = section && section.querySelector('.parallax');
        if (!section || !root) return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const layers = Array.from(root.querySelectorAll('.layer'));
        if (!layers.length) return;

        const roller = root.querySelector('.headline-roller');
        const track = roller && roller.querySelector('.headline-track');
        const items = track ? Array.from(track.querySelectorAll('.headline-item')) : [];
        const dotsWrap = root.querySelector('.headline-dots');
        let dots = [];
        let itemHeight = 0;
        let smoothedY = 0;
        let autoRotateStarted = false;
        let autoRotateInterval = null;
        let currentAutoIndex = 0;
        let smoothAnimationFrame = null;
        
        // Funkcja do czyszczenia stanu i interwałów
        function cleanup() {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
                autoRotateInterval = null;
            }
            if (smoothAnimationFrame) {
                cancelAnimationFrame(smoothAnimationFrame);
                smoothAnimationFrame = null;
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            autoRotateStarted = false;
        }
        
        // Czyszczenie przy odświeżeniu lub zamknięciu strony
        window.addEventListener('beforeunload', cleanup);
        
        // Reset przy zmianie widoczności strony
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                cleanup();
            } else {
                // Po powrocie, sprawdź czy sekcja jest widoczna i uruchom od razu
                setTimeout(() => {
                    const rect = section.getBoundingClientRect();
                    const viewH = window.innerHeight || document.documentElement.clientHeight;
                    const visible = rect.bottom > 0 && rect.top < viewH;
                    
                    if (visible) {
                        // Reset stanu
                        if (track && items.length && itemHeight > 0) {
                            smoothedY = 0;
                            currentAutoIndex = 0;
                            autoRotateStarted = false;
                            track.style.transform = 'translate3d(0, 0, 0)';
                            items.forEach((el, idx) => {
                                if (idx === 0) {
                                    el.style.transform = 'scale(1)';
                                    el.style.opacity = '1';
                                } else {
                                    el.style.transform = 'scale(0.94)';
                                    el.style.opacity = '0.35';
                                }
                            });
                            if (dots.length) {
                                dots.forEach((dotEl, i) => {
                                    if (i === 0) {
                                        dotEl.classList.add('is-active');
                                        dotEl.style.transform = 'scale(2)';
                                    } else {
                                        dotEl.classList.remove('is-active');
                                        dotEl.style.transform = 'scale(1)';
                                    }
                                });
                            }
                        }
                        // Uruchom update aby sprawdzić i ewentualnie uruchomić auto-rotate
                        onScroll();
                    }
                }, 100); // Małe opóźnienie aby upewnić się że DOM jest gotowy
            }
        });

        function measure() {
            if (items.length) {
                const oldHeight = itemHeight;
                itemHeight = items[0].offsetHeight;
                // Jeśli wysokość się zmieniła, przeskaluj smoothedY
                if (oldHeight > 0 && itemHeight !== oldHeight) {
                    const ratio = itemHeight / oldHeight;
                    smoothedY = smoothedY * ratio;
                } else if (oldHeight === 0) {
                    // Pierwsza inicjalizacja
                    smoothedY = 0;
                }
            }
        }
        measure();
        
        // Inicjalizacja stanu początkowego
        if (track && items.length && itemHeight > 0) {
            track.style.transform = 'translate3d(0, 0, 0)';
            items.forEach((el, idx) => {
                if (idx === 0) {
                    el.style.transform = 'scale(1)';
                    el.style.opacity = '1';
                } else {
                    el.style.transform = 'scale(0.94)';
                    el.style.opacity = '0.35';
                }
            });
            if (dots.length) {
                dots.forEach((dotEl, i) => {
                    if (i === 0) {
                        dotEl.classList.add('is-active');
                        dotEl.style.transform = 'scale(2)';
                    } else {
                        dotEl.classList.remove('is-active');
                        dotEl.style.transform = 'scale(1)';
                    }
                });
            }
        }

        if (dotsWrap && items.length) {
            dotsWrap.innerHTML = '';
            dots = items.map(() => {
                const d = document.createElement('span');
                d.className = 'dot';
                dotsWrap.appendChild(d);
                return d;
            });
        }

        const orbs = Array.from(root.querySelectorAll('.layer-orbs .orb'));
        orbs.forEach((orb) => {
            // Zawężone zakresy dla bardziej podobnych prędkości
            const d = 0.25 + Math.random() * 0.35; // 0.25-0.60 (zamiast 0.12-0.85)
            const xf = 0.7 + Math.random() * 0.6; // 0.7-1.3 (zamiast 0.6-1.8)
            const yf = 0.9 + Math.random() * 0.4; // 0.9-1.3 (zamiast 0.8-2.2)
            orb.dataset.depth = d.toFixed(3);
            orb.dataset.xf = xf.toFixed(3);
            orb.dataset.yf = yf.toFixed(3);
        });

        // Wygładzone wartości dla parallax
        let smoothedInfluence = 0;
        let smoothedGridDrift = 0;
        const smoothedOrbValues = orbs.map(() => ({ y: 0, scale: 1 }));
        const smoothedLayerValues = layers.map(() => ({ moveY: 0, tilt: 0 }));
        const LERP_FACTOR = 0.35; // Współczynnik wygładzania (większy = bardziej responsywny i płynny)

        let ticking = false;
        let animationFrameId = null;

        function update() {
            const rect = section.getBoundingClientRect();
            const viewH = window.innerHeight || document.documentElement.clientHeight;
            // Sekcja jest widoczna jeśli jakakolwiek jej część jest w viewport
            const visible = rect.bottom > 0 && rect.top < viewH;
            if (!visible) { ticking = false; return; }

            // Oblicz progress na podstawie pozycji sekcji - działa nawet gdy sekcja jest częściowo widoczna
            const sectionTop = rect.top;
            const sectionHeight = rect.height;
            const sectionCenter = sectionTop + sectionHeight / 2;
            const viewportCenter = viewH / 2;
            
            // Progress: 0 gdy sekcja jest powyżej viewport, 1 gdy poniżej, 0.5 gdy na środku
            // Większy zakres dla bardziej płynnego przejścia
            const distanceFromCenter = (sectionCenter - viewportCenter) / (viewH * 0.8);
            const progress = Math.max(0, Math.min(1, 0.5 - distanceFromCenter * 0.5));
            const targetInfluence = (progress - 0.5) * 3.5;

            // Wygładzanie influence - podwójne wygładzanie dla większej płynności
            smoothedInfluence = smoothedInfluence + (targetInfluence - smoothedInfluence) * LERP_FACTOR;
            // Dodatkowe wygładzanie dla jeszcze większej płynności
            smoothedInfluence = smoothedInfluence + (targetInfluence - smoothedInfluence) * (LERP_FACTOR * 0.5);

            // Wygładzanie warstw parallax
            layers.forEach((layer, index) => {
                const depth = parseFloat(layer.getAttribute('data-depth') || '0.3');
                const targetMoveY = smoothedInfluence * 45 * depth;
                const targetTilt = smoothedInfluence * 1.5 * depth;

                // Wygładzanie wartości dla każdej warstwy
                if (!smoothedLayerValues[index]) {
                    smoothedLayerValues[index] = { moveY: targetMoveY, tilt: targetTilt };
                }
                smoothedLayerValues[index].moveY = smoothedLayerValues[index].moveY + (targetMoveY - smoothedLayerValues[index].moveY) * LERP_FACTOR;
                smoothedLayerValues[index].moveY = smoothedLayerValues[index].moveY + (targetMoveY - smoothedLayerValues[index].moveY) * (LERP_FACTOR * 0.5);
                smoothedLayerValues[index].tilt = smoothedLayerValues[index].tilt + (targetTilt - smoothedLayerValues[index].tilt) * LERP_FACTOR;
                smoothedLayerValues[index].tilt = smoothedLayerValues[index].tilt + (targetTilt - smoothedLayerValues[index].tilt) * (LERP_FACTOR * 0.5);

                const moveX = 0;
                layer.style.transform = `translate3d(${moveX.toFixed(1)}px, ${smoothedLayerValues[index].moveY.toFixed(1)}px, 0) rotateX(${smoothedLayerValues[index].tilt.toFixed(2)}deg)`;
            });

            // Wygładzanie grid
            const grid = root.querySelector('.layer-grid');
            if (grid) {
                const targetDrift = smoothedInfluence * 25;
                smoothedGridDrift = smoothedGridDrift + (targetDrift - smoothedGridDrift) * LERP_FACTOR;
                smoothedGridDrift = smoothedGridDrift + (targetDrift - smoothedGridDrift) * (LERP_FACTOR * 0.5);
                grid.style.transform = `translate3d(0px, ${(smoothedGridDrift * 0.5).toFixed(1)}px, 0)`;
            }

            // Wygładzanie orbs
            if (orbs.length) {
                const base = 65;
                orbs.forEach((orb, index) => {
                    const d = parseFloat(orb.dataset.depth || '0.3');
                    const yf = parseFloat(orb.dataset.yf || '1');
                    const targetY = smoothedInfluence * base * d * yf;
                    const targetScale = 1 + smoothedInfluence * 0.06 * d;

                    // Wygładzanie wartości dla każdego orba
                    if (!smoothedOrbValues[index]) {
                        smoothedOrbValues[index] = { y: targetY, scale: targetScale };
                    }
                    smoothedOrbValues[index].y = smoothedOrbValues[index].y + (targetY - smoothedOrbValues[index].y) * LERP_FACTOR;
                    smoothedOrbValues[index].y = smoothedOrbValues[index].y + (targetY - smoothedOrbValues[index].y) * (LERP_FACTOR * 0.5);
                    smoothedOrbValues[index].scale = smoothedOrbValues[index].scale + (targetScale - smoothedOrbValues[index].scale) * LERP_FACTOR;
                    smoothedOrbValues[index].scale = smoothedOrbValues[index].scale + (targetScale - smoothedOrbValues[index].scale) * (LERP_FACTOR * 0.5);

                    const x = 0;
                    orb.style.transform = `translate3d(${x.toFixed(1)}px, ${smoothedOrbValues[index].y.toFixed(1)}px, 0) scale(${smoothedOrbValues[index].scale.toFixed(3)})`;
                });
            }

            if (track && items.length && itemHeight > 0) {
                const n = items.length;
                
                // PROGRESS THRESHOLD: kiedy startuje auto-rotacja (0.0-1.0, np. 0.05 = 5% scrollu)
                const AUTO_START_THRESHOLD = 0.05;
                
                // Reset auto-rotate jeśli sekcja jest niewidoczna
                if (!visible && autoRotateStarted) {
                    cleanup();
                    smoothedY = 0;
                    currentAutoIndex = 0;
                    if (track) {
                        track.style.transform = `translate3d(0, 0, 0)`;
                    }
                    // Reset items i dots
                    if (items.length) {
                        items.forEach((el, idx) => {
                            if (idx === 0) {
                                el.style.transform = 'scale(1)';
                                el.style.opacity = '1';
                            } else {
                                el.style.transform = 'scale(0.94)';
                                el.style.opacity = '0.35';
                            }
                        });
                    }
                    if (dots.length) {
                        dots.forEach((dotEl, i) => {
                            if (i === 0) {
                                dotEl.classList.add('is-active');
                                dotEl.style.transform = 'scale(2)';
                            } else {
                                dotEl.classList.remove('is-active');
                                dotEl.style.transform = 'scale(1)';
                            }
                        });
                    }
                    return;
                }
                
                if (!autoRotateStarted && progress > AUTO_START_THRESHOLD) {
                    // Upewnij się, że nie ma już działającego interwału
                    cleanup();
                    
                    autoRotateStarted = true;
                    const clamped = progress;
                    const pos = clamped * (n - 1);
                    currentAutoIndex = Math.round(pos);
                    smoothedY = -currentAutoIndex * itemHeight;
                    track.style.transform = `translate3d(0, ${smoothedY.toFixed(1)}px, 0)`;
                    
                    // INTERVAL: co ile sekund następuje zmiana tekstu (ms)
                    const AUTO_ROTATE_INTERVAL = 2600;
                    
                    // LERP FACTOR: prędkość przejścia (0.05-0.2, mniejsze = wolniejsze/miększe)
                    const AUTO_LERP_FACTOR = 0.08;
                    
                    // PRECISION: dokładność dojścia do pozycji (px, mniejsze = dokładniejsze)
                    const AUTO_PRECISION = 0.3;
                    
                    autoRotateInterval = setInterval(() => {
                        // Sprawdź czy sekcja jest nadal widoczna
                        const rect = section.getBoundingClientRect();
                        const viewH = window.innerHeight || document.documentElement.clientHeight;
                        const isVisible = rect.bottom > 0 && rect.top < viewH;
                        
                        if (!isVisible) {
                            cleanup();
                            return;
                        }
                        
                        currentAutoIndex = (currentAutoIndex + 1) % n;
                        const targetY = -currentAutoIndex * itemHeight;
                        
                        function smoothToTarget() {
                            // Sprawdź czy nie ma już kolejnej animacji w kolejce
                            if (!autoRotateInterval) return;
                            
                            smoothedY = smoothedY + (targetY - smoothedY) * AUTO_LERP_FACTOR;
                            track.style.transform = `translate3d(0, ${smoothedY.toFixed(1)}px, 0)`;
                            const posSmoothed = Math.max(0, Math.min(n - 1, (-smoothedY) / itemHeight));
                            
                            items.forEach((el, idx) => {
                                const d = Math.abs(idx - posSmoothed);
                                const scale = 1 + Math.max(-0.06, 0.12 - d * 0.12);
                                const opacity = Math.max(0.35, 1 - Math.pow(d, 1.6));
                                el.style.transform = `scale(${scale.toFixed(3)})`;
                                el.style.opacity = opacity.toFixed(2);
                            });
                            
                            const nearestSmoothed = Math.round(posSmoothed);
                            dots.forEach((dotEl, i) => {
                                const stepDist = Math.abs(i - nearestSmoothed);
                                const baseScale = Math.max(0.5, 1.6 - stepDist * 0.3);
                                const scale = (i === nearestSmoothed) ? 2.0 : baseScale;
                                dotEl.style.transform = `scale(${scale.toFixed(2)})`;
                                if (i === nearestSmoothed) dotEl.classList.add('is-active');
                                else dotEl.classList.remove('is-active');
                            });
                            
                            if (Math.abs(smoothedY - targetY) > AUTO_PRECISION && autoRotateInterval) {
                                smoothAnimationFrame = requestAnimationFrame(smoothToTarget);
                            } else {
                                smoothedY = targetY;
                                track.style.transform = `translate3d(0, ${smoothedY.toFixed(1)}px, 0)`;
                                smoothAnimationFrame = null;
                            }
                        }
                        smoothAnimationFrame = requestAnimationFrame(smoothToTarget);
                    }, AUTO_ROTATE_INTERVAL);
                }
                
                if (autoRotateStarted) {
                    const posSmoothed = Math.max(0, Math.min(n - 1, (-smoothedY) / itemHeight));
                    items.forEach((el, idx) => {
                        const d = Math.abs(idx - posSmoothed);
                        const scale = 1 + Math.max(-0.06, 0.12 - d * 0.12);
                        const opacity = Math.max(0.35, 1 - Math.pow(d, 1.6));
                        el.style.transform = `scale(${scale.toFixed(3)})`;
                        el.style.opacity = opacity.toFixed(2);
                    });
                    
                    const nearestSmoothed = Math.round(posSmoothed);
                    dots.forEach((dotEl, i) => {
                        const stepDist = Math.abs(i - nearestSmoothed);
                        const baseScale = Math.max(0.5, 1.6 - stepDist * 0.3);
                        const scale = (i === nearestSmoothed) ? 2.0 : baseScale;
                        dotEl.style.transform = `scale(${scale.toFixed(2)})`;
                        if (i === nearestSmoothed) dotEl.classList.add('is-active');
                        else dotEl.classList.remove('is-active');
                    });
                } else {
                    const clamped = progress;
                    const pos = clamped * (n - 1);
                    const nearest = Math.round(pos);
                    const baseY = -clamped * ((n - 1) * itemHeight);
                    const snappedY = -nearest * itemHeight;
                    const dist = Math.abs(pos - nearest);
                    const snap = Math.max(0, 1 - dist * 4);
                    const targetY = baseY * (1 - snap) + snappedY * snap;

                    const lerpFactor = 0.15;
                    if (!Number.isFinite(smoothedY)) smoothedY = targetY;
                    if (clamped <= 0.02) {
                        smoothedY = 0;
                    } else if (clamped >= 0.98) {
                        smoothedY = -((n - 1) * itemHeight);
                    } else {
                        smoothedY = smoothedY + (targetY - smoothedY) * lerpFactor;
                    }
                    track.style.transform = `translate3d(0, ${smoothedY.toFixed(1)}px, 0)`;

                    const posSmoothed = Math.max(0, Math.min(n - 1, (-smoothedY) / itemHeight));
                    items.forEach((el, idx) => {
                        const d = Math.abs(idx - posSmoothed);
                        const scale = 1 + Math.max(-0.06, 0.12 - d * 0.12);
                        const opacity = Math.max(0.35, 1 - Math.pow(d, 1.6));
                        el.style.transform = `scale(${scale.toFixed(3)})`;
                        el.style.opacity = opacity.toFixed(2);
                    });

                    const nearestSmoothed = Math.round(posSmoothed);
                    dots.forEach((dotEl, i) => {
                        const stepDist = Math.abs(i - nearestSmoothed);
                        const baseScale = Math.max(0.5, 1.6 - stepDist * 0.3);
                        const scale = (i === nearestSmoothed) ? 2.0 : baseScale;
                        dotEl.style.transform = `scale(${scale.toFixed(2)})`;
                        if (i === nearestSmoothed) dotEl.classList.add('is-active');
                        else dotEl.classList.remove('is-active');
                    });
                }
            }

            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    update();
                    // Kontynuuj animację dla płynności nawet gdy nie ma scrolla
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                    function smoothLoop() {
                        const rect = section.getBoundingClientRect();
                        const viewH = window.innerHeight || document.documentElement.clientHeight;
                        // Sekcja jest widoczna jeśli jakakolwiek jej część jest w viewport
                        const visible = rect.bottom > 0 && rect.top < viewH;
                        if (visible) {
                            update();
                            animationFrameId = requestAnimationFrame(smoothLoop);
                        } else {
                            animationFrameId = null;
                            // Restart pętli gdy sekcja znowu staje się widoczna
                            const checkVisible = () => {
                                const rect2 = section.getBoundingClientRect();
                                const viewH2 = window.innerHeight || document.documentElement.clientHeight;
                                const visible2 = rect2.bottom > 0 && rect2.top < viewH2;
                                if (visible2) {
                                    smoothLoop();
                                } else {
                                    requestAnimationFrame(checkVisible);
                                }
                            };
                            requestAnimationFrame(checkVisible);
                        }
                    }
                    animationFrameId = requestAnimationFrame(smoothLoop);
                });
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => { 
            cleanup(); // Wyczyść interwały przy resize
            measure(); 
            // Reset wygładzonych wartości parallax
            smoothedInfluence = 0;
            smoothedGridDrift = 0;
            smoothedOrbValues.forEach((val, i) => {
                smoothedOrbValues[i] = { y: 0, scale: 1 };
            });
            smoothedLayerValues.forEach((val, i) => {
                smoothedLayerValues[i] = { moveY: 0, tilt: 0 };
            });
            // Reset stanu po resize
            if (track && items.length && itemHeight > 0) {
                smoothedY = 0;
                currentAutoIndex = 0;
                autoRotateStarted = false;
                track.style.transform = 'translate3d(0, 0, 0)';
                items.forEach((el, idx) => {
                    if (idx === 0) {
                        el.style.transform = 'scale(1)';
                        el.style.opacity = '1';
                    } else {
                        el.style.transform = 'scale(0.94)';
                        el.style.opacity = '0.35';
                    }
                });
                if (dots.length) {
                    dots.forEach((dotEl, i) => {
                        if (i === 0) {
                            dotEl.classList.add('is-active');
                            dotEl.style.transform = 'scale(2)';
                        } else {
                            dotEl.classList.remove('is-active');
                            dotEl.style.transform = 'scale(1)';
                        }
                    });
                }
            }
            onScroll(); 
        }, { passive: true });
        onScroll();
    })();


    // Płynne przewijanie i zapobieganie odświeżaniu strony
    const navLinks = document.querySelectorAll('nav a, footer a, .hero-buttons a');
    const currentPage = window.location.pathname.split('/').pop() || 'start_page.html';

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Jeśli link wskazuje na start_page.html i jesteśmy już na tej stronie
            if (href === 'start_page.html' && currentPage === 'start_page.html') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }
            
            // Jeśli link zawiera #about (może być #about lub start_page.html#about)
            if (href && (href.includes('#about') || href === '#about')) {
                // Jeśli jesteśmy na start_page.html, przewiń do sekcji
                if (currentPage === 'start_page.html') {
                    e.preventDefault();
                    const aboutSection = document.querySelector('#about');
                    if (aboutSection) {
                        aboutSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
                // Jeśli nie jesteśmy na start_page.html, pozwól na normalne przejście
            }
        });
    });

    // Animacja wejścia kropek z losowymi opóźnieniami
    (function initAboutDotsAnimation() {
        const aboutSection = document.querySelector('.about-section');
        if (!aboutSection) return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        let animationStarted = false;

        const dotsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animationStarted) {
                    animationStarted = true;
                    
                    // Dodaj klasę aby uruchomić animacje
                    aboutSection.classList.add('dots-animated');
                    
                    // Pierwsza warstwa ::before - bez opóźnienia
                    aboutSection.style.setProperty('--dots-before-delay', '0.15s');
                    
                    // Druga warstwa ::after - 0.3s po pierwszej
                    aboutSection.style.setProperty('--dots-after-delay', '0.3s');
                    
                    // Usuń will-change po zakończeniu animacji
                    setTimeout(() => {
                        aboutSection.classList.add('animation-complete');
                    }, 1500); // 0.15s delay + 1s animation + 0.3s delay + 1s animation ≈ 1.5s
                    
                    dotsObserver.unobserve(aboutSection);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        dotsObserver.observe(aboutSection);
    })();

    // Dynamiczne kropki HTML z losowymi opóźnieniami i parallax
    (function initDynamicDots() {
        const aboutSection = document.querySelector('.about-section');
        const dotsContainer = document.querySelector('.about-dynamic-dots');
        if (!aboutSection || !dotsContainer) return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        let dotsGenerated = false;

        const dotsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !dotsGenerated) {
                    dotsGenerated = true;
                    generateDynamicDots(dotsContainer, aboutSection);
                    dotsObserver.unobserve(aboutSection);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        dotsObserver.observe(aboutSection);

        function generateDynamicDots(container, section) {
            // Generuj około 25-30 dynamicznych kropek
            const dotCount = 28;
            
            for (let i = 0; i < dotCount; i++) {
                const dot = document.createElement('div');
                dot.className = 'about-dynamic-dot';
                
                // Losowa pozycja
                const x = Math.random() * 100; // 0-100%
                const y = Math.random() * 100; // 0-100%
                
                // Losowy rozmiar (2-8px) - podwojony rozmiar
                const size = Math.random() * 6 + 2;
                
                // Losowy kolor (indigo lub emerald) - zmniejszona opacity
                const isIndigo = Math.random() > 0.5;
                const opacity = Math.random() * 0.2 + 0.4; // 0.4-0.6 (zmniejszona)
                const color = isIndigo 
                    ? `rgba(99, 102, 241, ${opacity})` 
                    : `rgba(16, 185, 129, ${opacity})`;
                
                // Losowe opóźnienie animacji (0-4s)
                const delay = Math.random() * 4;
                
                // Losowa głębia (0-1, 0 = najbliżej, 1 = najdalej)
                // Będzie używana do parallax
                const depth = Math.random();
                
                dot.style.left = `${x}%`;
                dot.style.top = `${y}%`;
                dot.style.width = `${size}px`;
                dot.style.height = `${size}px`;
                dot.style.background = color;
                dot.style.boxShadow = `0 0 ${size * 3}px ${color}`;
                dot.style.animationDelay = `${delay}s`;
                dot.style.setProperty('--parallax-offset-y', '0px');
                dot.dataset.depth = depth;
                
                container.appendChild(dot);
            }
        }
    })();

    // Parallax dla kropek w sekcji about
    (function initAboutDotsParallax() {
        const aboutSection = document.querySelector('.about-section');
        if (!aboutSection) return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const dotsBefore = aboutSection;
        const dotsAfter = aboutSection;
        let ticking = false;
        let dynamicDots = null; // Cache dla dynamicznych kropek
        let dynamicDotsCached = false;

        // Cache dynamicznych kropek po ich wygenerowaniu
        const cacheDynamicDots = () => {
            if (!dynamicDotsCached) {
                dynamicDots = document.querySelectorAll('.about-dynamic-dot');
                dynamicDotsCached = dynamicDots.length > 0;
            }
            return dynamicDots;
        };

        function update() {
            const rect = aboutSection.getBoundingClientRect();
            const viewH = window.innerHeight || document.documentElement.clientHeight;
            const visible = rect.bottom > -viewH * 0.2 && rect.top < viewH * 1.2;
            
            if (!visible) {
                ticking = false;
                return;
            }

            // Oblicz progress scrollowania przez sekcję
            const scrollProgress = (viewH - rect.top) / (viewH + rect.height);
            const normalizedProgress = Math.max(0, Math.min(1, scrollProgress));
            
            // Parallax offset - różne prędkości dla różnych warstw (depth effect)
            // ::before - przesuwa się szybciej (bliższa warstwa) - tylko góra-dół, bardzo widoczne
            const beforeOffsetY = (normalizedProgress - 0.5) * 550;
            
            // ::after - przesuwa się wolniej (dalsza warstwa) - tylko góra-dół, bardzo widoczne
            const afterOffsetY = (normalizedProgress - 0.5) * 400;

            // Zastosuj transform do pseudo-elementów
            dotsBefore.style.setProperty('--parallax-before-y', `${beforeOffsetY}px`);
            dotsAfter.style.setProperty('--parallax-after-y', `${afterOffsetY}px`);

            // Parallax dla dynamicznych kropek HTML (używamy cache)
            const cachedDots = cacheDynamicDots();
            if (cachedDots && cachedDots.length) {
                // Używamy pętli for dla lepszej wydajności
                for (let i = 0; i < cachedDots.length; i++) {
                    const dot = cachedDots[i];
                    const depth = parseFloat(dot.dataset.depth) || 0.5;
                    const speedFactor = 1 - depth;
                    const baseSpeed = 350;
                    const offsetY = (normalizedProgress - 0.5) * baseSpeed * speedFactor;
                    
                    dot.style.setProperty('--parallax-offset-y', `${offsetY}px`);
                }
            }

            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        update(); // Initial update

        // Reset cache gdy dynamiczne kropki są generowane
        const originalGenerateDots = window.generateDynamicDots;
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                dynamicDotsCached = false;
                dynamicDots = null;
            });
            const dotsContainer = document.querySelector('.about-dynamic-dots');
            if (dotsContainer) {
                observer.observe(dotsContainer, { childList: true });
            }
        }
    })();

    // E-books Search Functionality
    const initEbooksSearch = () => {
        const searchInput = document.getElementById('ebook-search');
        const categoryFilter = document.getElementById('category-filter');
        const ebooksGrid = document.getElementById('ebooks-grid');
        const noResults = document.getElementById('no-results');
        const ebookCards = document.querySelectorAll('.ebook-card');

        if (!searchInput || !ebooksGrid) return;

        const filterBooks = () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const selectedCategory = categoryFilter ? categoryFilter.value : '';
            let visibleCount = 0;

            ebookCards.forEach(card => {
                const title = card.getAttribute('data-title')?.toLowerCase() || '';
                const author = card.getAttribute('data-author')?.toLowerCase() || '';
                const category = card.getAttribute('data-category') || '';

                // Sprawdź wyszukiwanie
                const matchesSearch = !searchTerm || 
                    title.includes(searchTerm) || 
                    author.includes(searchTerm) || 
                    category.toLowerCase().includes(searchTerm);

                // Sprawdź kategorię
                const matchesCategory = !selectedCategory || category === selectedCategory;

                // Karta jest widoczna jeśli spełnia oba warunki
                const matches = matchesSearch && matchesCategory;

                if (matches) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Pokaż/ukryj komunikat "brak wyników"
            if (visibleCount === 0 && (searchTerm || selectedCategory)) {
                noResults.style.display = 'block';
                ebooksGrid.style.display = 'none';
            } else {
                noResults.style.display = 'none';
                ebooksGrid.style.display = 'grid';
            }
        };

        searchInput.addEventListener('input', filterBooks);
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterBooks);
        }
    };

    initEbooksSearch();
});
 