gsap.registerPlugin(ScrollTrigger);

var titleMovingForward = gsap.utils.toArray('.title-moving-forward');
titleMovingForward.forEach(function(movingTitle) {
  var parallax = gsap.to( movingTitle, 1, {x: -(movingTitle.offsetWidth  - window.innerWidth) , ease:Linear.easeNone});
  var parallaxScene = ScrollTrigger.create({
    trigger: movingTitle,
    end: () => `+=${movingTitle.offsetHeight + window.innerHeight}`,
    animation: parallax,
    scrub: 2,
  });
});


var titleMovingBackward = gsap.utils.toArray('.title-moving-backward');
titleMovingBackward.forEach(function(movingTitle) {
  gsap.set(movingTitle,{x:-(movingTitle.offsetWidth - window.innerWidth)});
  var parallax = gsap.to( movingTitle, 1, {x: 0 , ease:Linear.easeNone});
  var parallaxScene = ScrollTrigger.create({
    trigger: movingTitle,
    end: () => `+=${movingTitle.offsetHeight + window.innerHeight}`,
    animation: parallax,
    scrub: 2,
  });
});


// Horizontal Gallery

let scroll_tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.container-testimonis',
            start: "top center",
            // pin: true,
            scrub: true,
            end: "+=300",
            // markers: true,
        }
    }),
        testimonis = [...document.querySelectorAll('.testimoni')]
    scroll_tl.to('.container-testimonis h2', {
        scale: 1.5,
        duration: 1,
        ease: "slow"
    })
    scroll_tl.to(testimonis, {
        xPercent: -85 * (testimonis.length - 1),
        scrollTrigger: {
            trigger: ".container-testimonis_sm",
            start: "center center",
            pin: true,
            // horizontal: true,
            // pinSpacing:false,
            // markers: true,
            scrub: 1,
            snap: 1 / (testimonis.length - 1),
            // base vertical scrolling on how wide the container is so it feels more natural.
            // end: () => `+=${smallcontainer-testimonis.offsetWidth}`
            end: () => `+=4320`
        }
    });


// detail sumary
    function onClick(event) {
      let details = event.target.parentElement;

      details.style['overflow'] = 'hidden';

      if (details.open) {
        event.preventDefault();
        setTimeout(function () {
          details.open = false;
          details.style['overflow'] = 'visible';
        }, 500);
        details.style['max-height'] = '1em';
      } else {
        details.style['max-height'] = '100vh';
      }
    }

    window.onload = function () {
      for (summary of document.getElementsByTagName('summary')) {
        summary.addEventListener('click', onClick);
      }
    }
