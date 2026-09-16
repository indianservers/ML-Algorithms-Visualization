/* Distribution math + SVG helpers for the probability lab mockups.
   Deliberately a classic script (not an ES module) so the mockups can be opened
   straight off disk with file:// without tripping module CORS rules. */

(function (global) {
  "use strict";

  var MK = {};

  /* ------------------------------------------------------------------ math */

  var LANCZOS = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  function logGamma(z) {
    if (z < 0.5) {
      return (
        Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
      );
    }
    z -= 1;
    var x = 0.99999999999980993;
    for (var i = 0; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i + 1);
    var t = z + LANCZOS.length - 0.5;
    return (
      0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
    );
  }

  function erf(x) {
    var s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
        0.284496736) *
        t +
        0.254829592) *
        t *
        Math.exp(-x * x);
    return s * y;
  }

  MK.logGamma = logGamma;

  MK.normalPdf = function (x, mu, sd) {
    var z = (x - mu) / sd;
    return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
  };

  MK.normalCdf = function (x, mu, sd) {
    return 0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2)));
  };

  // Acklam's rational approximation to the inverse standard normal CDF.
  MK.normalQuantile = function (p, mu, sd) {
    var a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
      1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
    ];
    var b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
      6.680131188771972e1, -1.328068155288572e1,
    ];
    var c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
      -2.549732539343734, 4.374664141464968, 2.938163982698783,
    ];
    var d = [
      7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
      3.754408661907416,
    ];
    var pl = 0.02425;
    var q, r, z;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      z =
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= 1 - pl) {
      q = p - 0.5;
      r = q * q;
      z =
        ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
          q) /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      z =
        -(
          ((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q +
          c[5]
        ) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    return mu + sd * z;
  };

  MK.binomialPmf = function (k, n, p) {
    if (k < 0 || k > n) return 0;
    var logC = logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
    return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
  };

  MK.poissonPmf = function (k, lambda) {
    return Math.exp(-lambda + k * Math.log(lambda) - logGamma(k + 1));
  };

  MK.geometricPmf = function (k, p) {
    return k < 1 ? 0 : Math.pow(1 - p, k - 1) * p;
  };

  // Gamma with an integer shape keeps the CDF in closed form, which is all the
  // quantile lab needs to stay exact while still being visibly right-skewed.
  MK.gammaPdf = function (x, shape, scale) {
    if (x <= 0) return 0;
    return Math.exp(
      (shape - 1) * Math.log(x) -
        x / scale -
        shape * Math.log(scale) -
        logGamma(shape),
    );
  };

  MK.gammaCdf = function (x, shape, scale) {
    if (x <= 0) return 0;
    var y = x / scale;
    var term = 1;
    var sum = 1;
    for (var i = 1; i < shape; i++) {
      term *= y / i;
      sum += term;
    }
    return 1 - Math.exp(-y) * sum;
  };

  // Generic inverse-CDF by bisection: good to ~1e-9 over the bracket.
  MK.quantile = function (cdf, p, lo, hi) {
    for (var i = 0; i < 90; i++) {
      var mid = (lo + hi) / 2;
      if (cdf(mid) < p) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };

  /* -------------------------------------------------------------- formatting */

  MK.fixed = function (v, d) {
    return v.toFixed(d === undefined ? 2 : d);
  };

  MK.pct = function (v, d) {
    return (v * 100).toFixed(d === undefined ? 1 : d) + "%";
  };

  MK.range = function (a, b) {
    var out = [];
    for (var i = a; i <= b; i++) out.push(i);
    return out;
  };

  MK.linspace = function (a, b, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(a + ((b - a) * i) / (n - 1));
    return out;
  };

  MK.esc = function (s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  /* ------------------------------------------------------------- svg helpers */

  MK.chart = function (o) {
    var l = o.l === undefined ? 46 : o.l;
    var r = o.r === undefined ? 14 : o.r;
    var t = o.t === undefined ? 14 : o.t;
    var b = o.b === undefined ? 36 : o.b;
    var iw = o.w - l - r;
    var ih = o.h - t - b;
    var c = {
      w: o.w,
      h: o.h,
      l: l,
      r: r,
      t: t,
      b: b,
      iw: iw,
      ih: ih,
      x0: o.x[0],
      x1: o.x[1],
      y0: o.y[0],
      y1: o.y[1],
    };
    c.sx = function (v) {
      return l + ((v - c.x0) / (c.x1 - c.x0)) * iw;
    };
    c.sy = function (v) {
      return t + ih - ((v - c.y0) / (c.y1 - c.y0)) * ih;
    };
    return c;
  };

  // Axes, gridlines and tick labels. `xTicks`/`yTicks` are arrays of values or
  // of {v, label} pairs.
  MK.frame = function (c, o) {
    o = o || {};
    var s = "";
    var i, tk, v, label;

    function norm(tick) {
      return typeof tick === "object" ? tick : { v: tick, label: null };
    }

    var yTicks = o.yTicks || [];
    for (i = 0; i < yTicks.length; i++) {
      tk = norm(yTicks[i]);
      v = c.sy(tk.v);
      label = tk.label === null ? String(tk.v) : tk.label;
      if (o.grid !== false) {
        s +=
          '<line class="grid" x1="' +
          c.l +
          '" y1="' +
          v +
          '" x2="' +
          (c.l + c.iw) +
          '" y2="' +
          v +
          '"/>';
      }
      s +=
        '<text class="tick" text-anchor="end" x="' +
        (c.l - 8) +
        '" y="' +
        (v + 3.5) +
        '">' +
        label +
        "</text>";
    }

    var xTicks = o.xTicks || [];
    for (i = 0; i < xTicks.length; i++) {
      tk = norm(xTicks[i]);
      v = c.sx(tk.v);
      label = tk.label === null ? String(tk.v) : tk.label;
      s +=
        '<text class="tick" text-anchor="middle" x="' +
        v +
        '" y="' +
        (c.t + c.ih + 16) +
        '">' +
        label +
        "</text>";
      if (o.xGrid) {
        s +=
          '<line class="grid" x1="' +
          v +
          '" y1="' +
          c.t +
          '" x2="' +
          v +
          '" y2="' +
          (c.t + c.ih) +
          '"/>';
      }
    }

    s +=
      '<line class="axis" x1="' +
      c.l +
      '" y1="' +
      (c.t + c.ih) +
      '" x2="' +
      (c.l + c.iw) +
      '" y2="' +
      (c.t + c.ih) +
      '"/>';
    s +=
      '<line class="axis" x1="' +
      c.l +
      '" y1="' +
      c.t +
      '" x2="' +
      c.l +
      '" y2="' +
      (c.t + c.ih) +
      '"/>';

    if (o.xLabel) {
      s +=
        '<text class="axis-label" text-anchor="middle" x="' +
        (c.l + c.iw / 2) +
        '" y="' +
        (c.h - 6) +
        '">' +
        o.xLabel +
        "</text>";
    }
    if (o.yLabel) {
      s +=
        '<text class="axis-label" text-anchor="middle" transform="rotate(-90 12 ' +
        (c.t + c.ih / 2) +
        ')" x="12" y="' +
        (c.t + c.ih / 2) +
        '">' +
        o.yLabel +
        "</text>";
    }
    return s;
  };

  MK.linePath = function (c, pts) {
    var d = "";
    for (var i = 0; i < pts.length; i++) {
      d += (i ? "L" : "M") + c.sx(pts[i][0]) + " " + c.sy(pts[i][1]);
    }
    return d;
  };

  MK.areaPath = function (c, pts, base) {
    if (!pts.length) return "";
    var y = c.sy(base === undefined ? c.y0 : base);
    return (
      "M" +
      c.sx(pts[0][0]) +
      " " +
      y +
      MK.linePath(c, pts).replace(/^M/, "L") +
      "L" +
      c.sx(pts[pts.length - 1][0]) +
      " " +
      y +
      "Z"
    );
  };

  // Right-continuous staircase, the shape a CDF actually has.
  MK.stepPath = function (c, pts) {
    var d = "M" + c.sx(pts[0][0]) + " " + c.sy(pts[0][1]);
    for (var i = 1; i < pts.length; i++) {
      d +=
        "L" +
        c.sx(pts[i][0]) +
        " " +
        c.sy(pts[i - 1][1]) +
        "L" +
        c.sx(pts[i][0]) +
        " " +
        c.sy(pts[i][1]);
    }
    return d;
  };

  /* Render into an <svg> sized by its container so nothing is distorted. */
  MK.render = function (selector, height, build) {
    var el = document.querySelector(selector);
    if (!el) return;
    var w = Math.round(el.getBoundingClientRect().width) || 620;
    el.setAttribute("viewBox", "0 0 " + w + " " + height);
    el.setAttribute("width", w);
    el.setAttribute("height", height);
    el.innerHTML = build(w, height);
  };

  /* Fill the [data-fill] placeholders from a plain object of strings. */
  MK.fill = function (values) {
    Object.keys(values).forEach(function (key) {
      var nodes = document.querySelectorAll('[data-fill="' + key + '"]');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].textContent = values[key];
      }
    });
  };

  /* Position a mock slider thumb/fill from a 0..1 fraction. */
  MK.slider = function (selector, frac) {
    var el = document.querySelector(selector);
    if (!el) return;
    var f = Math.max(0, Math.min(1, frac));
    el.querySelector("i").style.width = f * 100 + "%";
    el.querySelector("u").style.left = f * 100 + "%";
  };

  global.MK = MK;
})(window);
