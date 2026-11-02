// Temperature Converter
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Get the parts of the page we need
  var form = document.getElementById('converter');
  var input = document.getElementById('temp');
  var errorBox = document.getElementById('error');
  var outputs = {
    C: document.getElementById('out-c'),
    F: document.getElementById('out-f'),
    K: document.getElementById('out-k')
  };
  var fill = document.getElementById('fill');
  var bulb = document.getElementById('bulb');
  var hint = document.getElementById('hint');
  var condition = document.getElementById('condition');
  var radios = form.querySelectorAll('input[name="unit"]');
  var chips = document.querySelectorAll('.chip');

  // 2. Rules and settings
  // Allowed: +25, -3.5, .5, 10.  Not allowed: abc, 12abc, 1,5, empty
  var NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;
  var ABSOLUTE_ZERO = { C: -273.15, F: -459.67, K: 0 };
  var SYMBOL = { C: '°C', F: '°F', K: 'K' };

  function selectedUnit() {
    return form.elements.unit.value;   // 'C', 'F' or 'K'
  }

  // 3. Conversion: every unit goes through Kelvin
  function toKelvin(value, unit) {
    if (unit === 'C') { return value + 273.15; }
    if (unit === 'F') { return (value - 32) * 5 / 9 + 273.15; }
    return value;
  }

  function fromKelvin(kelvin, unit) {
    if (unit === 'C') { return kelvin - 273.15; }
    if (unit === 'F') { return (kelvin - 273.15) * 9 / 5 + 32; }
    return kelvin;
  }

  // Round to 2 decimals and never show "-0"
  function format(number, unit) {
    var rounded = Math.round(number * 100) / 100;
    if (Object.is(rounded, -0)) { rounded = 0; }
    return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + SYMBOL[unit];
  }

  // 4. Check what the user typed
  // Returns { ok: true, value: 25 } or { ok: false, message: '...' }
  function check(text, unit) {
    var trimmed = text.trim();

    if (trimmed === '') {
      return { ok: false, message: 'Please enter a temperature.' };
    }
    if (!NUMBER_PATTERN.test(trimmed)) {
      return { ok: false, message: 'Please enter numbers only, like 25 or -3.5.' };
    }

    var value = Number(trimmed);
    if (toKelvin(value, unit) < -1e-9) {
      return {
        ok: false,
        message: 'This is below absolute zero, the lowest possible temperature (' +
          ABSOLUTE_ZERO[unit] + ' ' + SYMBOL[unit] + '). Please enter a higher value.'
      };
    }
    return { ok: true, value: value };
  }

  function showError(message) {
    errorBox.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  // 5. Look and feel that depends on the temperature (in Celsius)
  function modeFor(celsius) {
    if (celsius <= 0) { return 'cold'; }
    if (celsius >= 35) { return 'hot'; }
    return 'mild';
  }

  function describe(celsius) {
    if (celsius <= 0) { return 'Freezing or below'; }
    if (celsius < 15) { return 'Cool'; }
    if (celsius < 30) { return 'Comfortable'; }
    if (celsius < 40) { return 'Hot'; }
    if (celsius < 100) { return 'Very hot'; }
    return 'Boiling or above';
  }

  function setMode(mode) {
    document.body.setAttribute('data-mode', mode);
    fx.setMode(mode);
  }

  // Numbers count up to the new value
  var shown = { C: null, F: null, K: null };
  var frames = {};

  function countTo(unit, target) {
    var element = outputs[unit];
    cancelAnimationFrame(frames[unit]);

    if (reduceMotion) {
      element.textContent = format(target, unit);
      shown[unit] = target;
      return;
    }

    var from = shown[unit] === null ? 0 : shown[unit];
    var startTime = null;
    var duration = 700;

    function step(timestamp) {
      if (startTime === null) { startTime = timestamp; }
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = progress === 1 ? target : from + (target - from) * eased;
      element.textContent = format(current, unit);
      shown[unit] = current;
      if (progress < 1) { frames[unit] = requestAnimationFrame(step); }
    }
    frames[unit] = requestAnimationFrame(step);
  }

  // 6. Show the result in all three units
  function showResult(value, unit) {
    var kelvin = toKelvin(value, unit);
    var celsius = fromKelvin(kelvin, 'C');
    var mode = modeFor(celsius);

    countTo('C', celsius);
    countTo('F', fromKelvin(kelvin, 'F'));
    countTo('K', kelvin);

    // Thermometer: -50 °C is empty, 100 °C is full
    var percent = (celsius + 50) / 150 * 100;
    percent = Math.max(3, Math.min(100, percent));
    fill.style.height = percent + '%';
    fill.className = 'fill ' + mode;
    bulb.className = 'bulb ' + mode;

    condition.textContent = describe(celsius);
    condition.className = 'condition ' + mode;
    condition.hidden = false;

    hint.textContent = 'You entered ' + format(value, unit) + '.';
    setMode(mode);
  }

  function clearResult() {
    ['C', 'F', 'K'].forEach(function (unit) {
      cancelAnimationFrame(frames[unit]);
      shown[unit] = null;
      outputs[unit].textContent = '-';
    });
    fill.style.height = '3%';
    fill.className = 'fill';
    bulb.className = 'bulb';
    condition.hidden = true;
    hint.textContent = 'Enter a number and press Convert.';
    setMode('idle');
  }

  function convert() {
    var unit = selectedUnit();
    var result = check(input.value, unit);

    if (!result.ok) {
      showError(result.message);
      clearResult();
      input.focus();
      return;
    }
    showError('');
    showResult(result.value, unit);
  }

  // 7. Background effect: snow when cold, sparks when hot, soft dots otherwise
  var fx = (function () {
    var canvas = document.getElementById('fx');
    var noop = { setMode: function () {} };
    if (!canvas || !canvas.getContext || reduceMotion) { return noop; }

    var ctx = canvas.getContext('2d');
    var width = 0, height = 0;
    var particles = [];
    var mode = 'idle';

    function reset(p, anywhere) {
      p.x = Math.random() * width;
      p.phase = Math.random() * Math.PI * 2;
      if (mode === 'cold') {
        p.y = anywhere ? Math.random() * height : -10;
        p.vy = 0.4 + Math.random() * 0.8;
        p.r = 1.5 + Math.random() * 2;
      } else if (mode === 'hot') {
        p.y = anywhere ? Math.random() * height : height + 10;
        p.vy = -(0.6 + Math.random() * 1.2);
        p.r = 1 + Math.random() * 2;
      } else {
        p.y = Math.random() * height;
        p.vy = (Math.random() - 0.5) * 0.3;
        p.r = 1 + Math.random() * 1.5;
      }
    }

    function build() {
      width = window.innerWidth;
      height = window.innerHeight;
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      var count = width < 600 ? 35 : 70;
      particles = [];
      for (var i = 0; i < count; i++) {
        var p = {};
        reset(p, true);
        particles.push(p);
      }
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function (p) {
        p.phase += 0.02;
        p.x += Math.sin(p.phase) * 0.35;
        p.y += p.vy;

        var alpha = 0.35;
        if (mode === 'cold') {
          ctx.fillStyle = 'rgba(225, 242, 255, 0.8)';
          if (p.y > height + 10) { reset(p, false); }
        } else if (mode === 'hot') {
          alpha = 0.25 + 0.65 * (p.y / height);      // fades as it rises
          ctx.fillStyle = 'rgba(255, 150, 70, ' + Math.max(0, alpha) + ')';
          if (p.y < -10) { reset(p, false); }
        } else {
          ctx.fillStyle = mode === 'mild' ? 'rgba(255, 200, 100, 0.4)' : 'rgba(160, 180, 255, 0.35)';
          if (p.y < -10) { p.y = height + 10; }
          if (p.y > height + 10) { p.y = -10; }
        }
        if (p.x < -10) { p.x = width + 10; }
        if (p.x > width + 10) { p.x = -10; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }

    build();
    requestAnimationFrame(frame);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    });

    return {
      setMode: function (newMode) {
        if (newMode === mode) { return; }
        mode = newMode;
        particles.forEach(function (p) { reset(p, true); });
      }
    };
  })();

  // 8. Events
  // Convert button (or Enter key)
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    convert();
  });

  // While typing: warn at once if the text is not a valid number
  input.addEventListener('input', function () {
    if (input.value.trim() === '') {
      showError('');
      return;
    }
    var result = check(input.value, selectedUnit());
    showError(result.ok ? '' : result.message);
  });

  // When the unit changes: check again, because absolute zero is different in each unit
  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (input.value.trim() === '') { return; }
      var result = check(input.value, selectedUnit());
      showError(result.ok ? '' : result.message);
    });
  });

  // Example buttons: fill the form and convert
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      input.value = chip.getAttribute('data-value');
      radios.forEach(function (radio) {
        radio.checked = radio.value === chip.getAttribute('data-unit');
      });
      convert();
    });
  });
})();
