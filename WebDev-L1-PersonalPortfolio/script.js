// JavaScript for the portfolio. The page still works without this file.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Footer year updates by itself
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  // 2. Mobile menu button
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    menu.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 3. Typing effect in the hero section
  var typed = document.getElementById('typed');
  if (typed && !reduceMotion) {
    var words = [
      'building web pages',
      'writing Python programs',
      'editing videos',
      'automating with Telegram bots'
    ];
    var wordIndex = 0;
    var charCount = words[0].length;
    var deleting = true;

    var tick = function () {
      var word = words[wordIndex];
      if (deleting) {
        charCount--;
        typed.textContent = word.slice(0, charCount);
        if (charCount === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(tick, 350);
          return;
        }
        setTimeout(tick, 35);
      } else {
        charCount++;
        typed.textContent = word.slice(0, charCount);
        if (charCount === word.length) {
          deleting = true;
          setTimeout(tick, 1800);
          return;
        }
        setTimeout(tick, 70);
      }
    };
    setTimeout(tick, 2000);
  }

  // 4. Highlight the nav link of the section you are reading
  var links = document.querySelectorAll('.nav-links a');
  var linkById = {};
  links.forEach(function (a) { linkById[a.getAttribute('href').slice(1)] = a; });
  var sections = document.querySelectorAll('section[id], footer[id]');
  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (l) { l.classList.remove('active'); });
        var link = linkById[entry.target.id];
        if (link) { link.classList.add('active'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  // 5. Hero background: a network of nodes. Small amber dots travel
  //    between the nodes, like messages passing through my Telegram bot.
  var canvas = document.getElementById('network');
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var LINK_DISTANCE = 130;
    var width = 0, height = 0;
    var nodes = [], pulses = [];
    var mouse = { x: -999, y: -999 };
    var running = false;
    var lastPulse = 0;

    var resize = function () {
      var rect = hero.getBoundingClientRect();
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      var count = Math.max(24, Math.min(70, Math.round(width * height / 16000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35
        });
      }
      pulses = [];
    };

    var spawnPulse = function () {
      var a = nodes[Math.floor(Math.random() * nodes.length)];
      var near = nodes.filter(function (b) {
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        return b !== a && d < LINK_DISTANCE;
      });
      if (near.length) {
        pulses.push({ a: a, b: near[Math.floor(Math.random() * near.length)], t: 0 });
      }
    };

    var frame = function (now) {
      if (!running) { return; }
      ctx.clearRect(0, 0, width, height);

      // move nodes and push them away from the mouse
      nodes.forEach(function (n) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) { n.vx *= -1; }
        if (n.y < 0 || n.y > height) { n.vy *= -1; }
        var dx = n.x - mouse.x;
        var dy = n.y - mouse.y;
        var dist = Math.hypot(dx, dy);
        if (dist < 110 && dist > 0) {
          n.x += (dx / dist) * 1.2;
          n.y += (dy / dist) * 1.2;
        }
      });

      // lines between close nodes
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < LINK_DISTANCE) {
            ctx.strokeStyle = 'rgba(150, 175, 255,' + ((1 - d / LINK_DISTANCE) * 0.35) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // nodes
      ctx.fillStyle = 'rgba(205, 220, 255, 0.85)';
      nodes.forEach(function (n) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // travelling amber dots
      if (now - lastPulse > 350 && pulses.length < 14) {
        spawnPulse();
        lastPulse = now;
      }
      pulses = pulses.filter(function (p) {
        p.t += 0.025;
        if (p.t >= 1) { return false; }
        var x = p.a.x + (p.b.x - p.a.x) * p.t;
        var y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.fillStyle = 'rgba(255, 176, 32, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffb020';
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      requestAnimationFrame(frame);
    };

    var start = function () {
      if (running) { return; }
      running = true;
      requestAnimationFrame(frame);
    };

    resize();
    hero.addEventListener('mousemove', function (event) {
      var rect = hero.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () { mouse.x = -999; mouse.y = -999; });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    // run the animation only while the hero is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { start(); } else { running = false; }
      }).observe(hero);
    } else {
      start();
    }
  }
})();
