"use strict";
/* Block Guangzhou — original WebGL2 walk. idea after @ns2250225; no code copied. */

var stage = document.getElementById("stage");
var canvas = document.getElementById("view");
var stick = document.getElementById("stick");
var knob = document.getElementById("knob");
var acts = document.getElementById("acts");
var jumpBtn = document.getElementById("jump");
var runBtn = document.getElementById("run");
var shotBtn = document.getElementById("shot");
var gear = document.getElementById("gear");
var sheet = document.getElementById("sheet");
var toastEl = document.getElementById("toast");
var flashEl = document.getElementById("flash");
var album = document.getElementById("album");

var START = { x: -0.35, z: -9.2, yaw: 0.04 };
var CAM = { dist: 5.15, pitch: 0.22, fovy: 1.0, ahead: 3.4, lookY: 2.7 };

var PAL = {
  skin: [[0.96, 0.8, 0.68], [0.88, 0.63, 0.44], [0.74, 0.5, 0.32], [0.5, 0.32, 0.22], [0.34, 0.21, 0.14]],
  hair: [[0.09, 0.07, 0.08], [0.29, 0.16, 0.1], [0.55, 0.22, 0.16], [0.84, 0.64, 0.28], [0.86, 0.88, 0.9]],
  shirt: [[0.88, 0.16, 0.14], [0.1, 0.5, 0.52], [0.95, 0.88, 0.74], [0.16, 0.24, 0.52], [0.9, 0.66, 0.14]],
  pants: [[0.12, 0.16, 0.3], [0.1, 0.1, 0.12], [0.5, 0.42, 0.28], [0.22, 0.34, 0.52], [0.42, 0.16, 0.22]]
};
var HATS = ["none", "cap", "straw", "beret"];
var look = { skin: 1, hair: 0, shirt: 0, pants: 0, hat: "none" };
var HATCOL = [0.12, 0.14, 0.28];
var SHOE = [0.16, 0.12, 0.1];

var SKY = {
  dawn: { top: [0.45, 0.64, 0.88], mid: [0.98, 0.74, 0.52], hor: [1, 0.88, 0.72], fog: [0.99, 0.84, 0.68], sun: [0.8, 0.4], sunCol: [1, 0.94, 0.78], light: [1, 0.94, 0.84], amb: 0.74, glow: 0.1, night: 0 },
  dusk: { top: [0.22, 0.28, 0.55], mid: [0.93, 0.46, 0.24], hor: [1, 0.74, 0.42], fog: [0.99, 0.7, 0.44], sun: [0.68, 0.74], sunCol: [1, 0.82, 0.5], light: [1, 0.84, 0.6], amb: 0.62, glow: 0.85, night: 0 },
  night: { top: [0.02, 0.03, 0.08], mid: [0.05, 0.07, 0.16], hor: [0.07, 0.09, 0.18], fog: [0.05, 0.07, 0.13], sun: [0.84, 0.8], sunCol: [0.62, 0.74, 1], light: [0.5, 0.62, 0.92], amb: 0.2, glow: 1, night: 1 }
};
var skyName = "dusk";
var sky = {
  top: SKY.dusk.top.slice(), mid: SKY.dusk.mid.slice(), hor: SKY.dusk.hor.slice(),
  fog: SKY.dusk.fog.slice(), sun: SKY.dusk.sun.slice(), sunCol: SKY.dusk.sunCol.slice(),
  light: SKY.dusk.light.slice(), amb: 0.56, glow: 0.82, night: 0
};

var STAMPS = [
  { id: "tower", zh: "广州塔", en: "Canton Tower", x: 2.35, z: 3.6, r: 14 },
  { id: "river", zh: "珠江", en: "Pearl River", x: 0, z: 2, r: 14 },
  { id: "qilou", zh: "骑楼街", en: "Arcade Street", x: 0, z: 16, r: 11 },
  { id: "hall", zh: "蓝顶礼堂", en: "Blue Hall", x: 0, z: 42, r: 9 },
  { id: "goats", zh: "五羊", en: "Five Goats", x: -11, z: 37, r: 8 },
  { id: "shamian", zh: "沙面", en: "Shamian", x: -14, z: -24, r: 11 },
  { id: "twins", zh: "双塔", en: "Twin Towers", x: 18, z: 22, r: 11 },
  { id: "hill", zh: "白云", en: "Cloud Hill", x: -16, z: 52, r: 11 }
];
var got = Object.create(null);
var gotN = 0;

var P = { x: START.x, y: 0, z: START.z, yaw: START.yaw, vy: 0, grounded: true, phase: 0.4, facing: START.yaw, run: false };
var camYaw = START.yaw;
var camPitch = CAM.pitch;
var time = 0;
var jumpQueued = false;
var touched = false;
var joyX = 0;
var joyY = 0;
var lastStep = -1;
var toastUntil = 0;
var keys = Object.create(null);

var blocks = new Float32Array(420 * 4);
var blockN = 0;
var worldList = [];
var DYN_MAX = 160;
var dyn = new Float32Array(DYN_MAX * 16);
var dynCount = 0;

var npcs = [
  { x: 3.2, z: -11.2, dir: 1, min: -6, max: 6, base: 0, phase: 1, speed: 1.15, skin: 2, hair: 1, shirt: 1, pants: 2, hat: "cap" },
  { x: -2.4, z: 14, dir: -1, min: 8, max: 22, base: 0, phase: 2, speed: 1.3, skin: 0, hair: 3, shirt: 4, pants: 0, hat: "none" },
  { x: 1.2, z: 28, dir: 1, min: 20, max: 34, base: 0, phase: 0.4, speed: 1.05, skin: 3, hair: 0, shirt: 2, pants: 1, hat: "straw" }
];
var cars = [
  { x: 1.35, z: 14, speed: 4.2, col: [0.85, 0.22, 0.18] },
  { x: -1.35, z: 30, speed: -5, col: [0.95, 0.86, 0.35] },
  { x: 1.35, z: 22, speed: 3.4, col: [0.25, 0.45, 0.72] }
];
var boatX = -1.2;

var stalls = [
  { part: "skin", x: -4.15, z: -12.15 },
  { part: "hair", x: -3.35, z: -12.15 },
  { part: "shirt", x: -4.15, z: -11.35 },
  { part: "pants", x: -3.35, z: -11.35 }
];

var gl, cityProg, skyProg, vaoWorld, vaoDyn, vaoSky, dynBuf;
var uCity = {}, uSky = {};
var worldCount = 0;
var view = new Float32Array(16);
var proj = new Float32Array(16);
var vp = new Float32Array(16);
var eye = new Float32Array(3);
var center = new Float32Array(3);
var up = new Float32Array([0, 1, 0]);
var sunV = new Float32Array([0.42, 0.84, 0.32]);
var viewW = 390, viewH = 844;
var bufW = 2, bufH = 2;
var longCap = 680;
var painted = 0;
var sent = false;
var actx = null, master = null, noiseBuf = null;
var lastCssW = 0, lastCssH = 0;

function hexRgb(r, g, b) { return [r, g, b]; }

function box(cx, cy, cz, sx, sy, sz, yaw, pitch, kind, rgb, emit) {
  worldList.push(cx, cy, cz, yaw, sx, sy, sz, pitch, rgb[0], rgb[1], rgb[2], kind, emit || 0, 0, 0, 0);
}
function block(cx, cz, hx, hz) {
  if (blockN >= 420) return;
  var r = 0.34;
  var o = blockN * 4;
  blocks[o] = cx - hx - r;
  blocks[o + 1] = cx + hx + r;
  blocks[o + 2] = cz - hz - r;
  blocks[o + 3] = cz + hz + r;
  blockN++;
}
function hash(i, j) {
  var n = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function dbox(cx, cy, cz, sx, sy, sz, yaw, pitch, kind, rgb, emit) {
  if (dynCount >= DYN_MAX) return;
  var o = dynCount * 16;
  dyn[o] = cx; dyn[o + 1] = cy; dyn[o + 2] = cz; dyn[o + 3] = yaw;
  dyn[o + 4] = sx; dyn[o + 5] = sy; dyn[o + 6] = sz; dyn[o + 7] = pitch;
  dyn[o + 8] = rgb[0]; dyn[o + 9] = rgb[1]; dyn[o + 10] = rgb[2]; dyn[o + 11] = kind;
  dyn[o + 12] = emit || 0;
  dynCount++;
}

function buildWorld() {
  var stone = [0.84, 0.66, 0.42];
  var road = [0.38, 0.4, 0.43];
  var quay = [0.55, 0.48, 0.4];
  var cream = [0.95, 0.9, 0.82];
  box(0, -0.9, 10, 90, 1.8, 110, 0, 0, 0, stone, 0);
  box(0, 0.03, 2, 70, 0.08, 8.2, 0, 0, 2, [0.05, 0.35, 0.4], 0);
  box(0, 0.07, -2.15, 70, 0.08, 0.45, 0, 0, 0, quay, 0);
  box(0, 0.07, 6.15, 70, 0.08, 0.45, 0, 0, 0, quay, 0);
  box(0, 0.05, 24, 4.2, 0.06, 32, 0, 0, 0, road, 0);
  box(0, 0.055, 24, 18, 0.05, 3.4, 0, 0, 0, road, 0);
  box(-14, 0.2, 2, 4.6, 0.16, 9.2, 0, 0, 0, [0.72, 0.7, 0.66], 0);
  box(4.0, 0.2, 2, 4.4, 0.16, 9.2, 0, 0, 0, [0.72, 0.7, 0.66], 0);
  var rail;
  for (rail = -1; rail <= 7; rail += 2.2) {
    box(-16.1, 0.55, rail, 0.16, 0.55, 0.16, 0, 0, 0, cream, 0);
    box(-11.9, 0.55, rail, 0.16, 0.55, 0.16, 0, 0, 0, cream, 0);
    box(2.0, 0.55, rail, 0.16, 0.55, 0.16, 0, 0, 0, cream, 0);
    box(6.0, 0.55, rail, 0.16, 0.55, 0.16, 0, 0, 0, cream, 0);
  }
  box(-14, 0.78, 2, 0.12, 0.1, 8.4, 0, 0, 0, cream, 0);
  box(4, 0.78, 2, 0.12, 0.1, 8.4, 0, 0, 4, [1, 0.55, 0.35], 0.8);

  var wallCols = [
    [0.94, 0.86, 0.72], [0.84, 0.42, 0.36], [0.52, 0.7, 0.64],
    [0.76, 0.55, 0.3], [0.9, 0.78, 0.66], [0.78, 0.62, 0.58]
  ];
  var i, j, x, z, hsh, h, col;
  for (i = -3; i <= 3; i++) {
    for (j = 0; j <= 5; j++) {
      x = i * 6.5;
      z = 9.2 + j * 6.15;
      if (Math.abs(x) < 3.15) continue;
      if (Math.abs(z - 24) < 3.05) continue;
      if (x > 11 && z > 14 && z < 32) continue;
      hsh = hash(i + 9, j + 4);
      h = 3.1 + hsh * (j > 1 ? 6.5 : 3.2);
      col = wallCols[(hsh * wallCols.length) | 0];
      box(x, h * 0.5, z, 4.5, h, 4.3, 0, 0, 1, col, 0.2);
      block(x, z, 2.25, 2.15);
    }
  }
  var pastel = [
    [0.93, 0.74, 0.75], [0.7, 0.8, 0.88], [0.95, 0.9, 0.78], [0.76, 0.84, 0.74]
  ];
  for (i = 0; i < 4; i++) {
    for (j = 0; j < 3; j++) {
      x = -20 + i * 5.1;
      z = -29 + j * 4.5;
      hsh = hash(i + 2, j + 11);
      h = 2.1 + hsh * 2.3;
      box(x, h * 0.5, z, 3.7, h, 3.3, 0, 0, 1, pastel[(i + j) & 3], 0.08);
      block(x, z, 1.85, 1.65);
    }
  }
  box(-14, 2.3, -24.5, 2.2, 4.6, 2.2, 0, 0, 1, [0.93, 0.9, 0.84], 0.05);
  box(-14, 4.85, -24.5, 1.2, 0.7, 1.2, 0, 0, 0, [0.75, 0.22, 0.22], 0);
  block(-14, -24.5, 1.2, 1.2);

  tower(2.35, 3.6);
  block(2.35, 3.6, 1.15, 1.15);

  box(16.5, 7.5, 18, 3.1, 15, 3.1, 0.15, 0, 1, [0.62, 0.82, 0.9], 0.55);
  box(20.8, 10, 25.5, 2.7, 20, 2.7, 0, 0, 1, [0.78, 0.9, 0.94], 0.4);
  block(16.5, 18, 1.7, 1.7);
  block(20.8, 25.5, 1.5, 1.5);

  box(0, 1.7, 42, 8.2, 3.4, 6.2, 0, 0, 1, cream, 0.05);
  box(0, 3.7, 42, 8.6, 0.55, 6.6, 0, 0, 0, [0.2, 0.4, 0.72], 0);
  box(0, 4.7, 42, 4.6, 1.5, 4.6, 0, 0, 0, [0.16, 0.34, 0.64], 0);
  box(0, 5.7, 42, 2.1, 0.7, 2.1, 0, 0, 4, [0.9, 0.93, 0.98], 0.35);
  block(0, 42, 4.2, 3.2);

  var g, gy, ang;
  for (g = 0; g < 5; g++) {
    ang = g / 5 * Math.PI * 2;
    goat(-11 + Math.cos(ang) * 1.7, 37 + Math.sin(ang) * 1.7, ang + 1.2);
  }
  block(-11, 37, 2.6, 2.6);

  hill(-16, 52);
  hill(8, 55);
  block(-16, 52, 4.2, 3.2);
  block(8, 55, 3.6, 2.8);

  tree(-2.3, -5.6, 2.3);
  tree(3.6, -6.4, 2.1);
  tree(-5.5, -15.5, 2.8);
  tree(8.2, 7.2, 3);
  tree(-7.4, 8, 2.6);
  tree(-18, -22, 2.4);
  tree(-10, -26, 2.7);
  tree(-16, -18, 2.3);
  tree(6, 40, 2.5);
  tree(-6, 36, 2.8);

  lamp(-1.7, -6.8);
  lamp(2.6, -5.4);
  lamp(-8, 8);
  lamp(8, 12);
  lamp(-5, 20);
  lamp(5, 32);

  box(-3.75, 0.45, -11.75, 1.7, 0.7, 1.5, 0, 0, 0, [0.55, 0.32, 0.22], 0);
  box(-3.75, 1.35, -11.75, 2.1, 0.12, 1.15, 0, 0, 1, [0.75, 0.18, 0.16], 0.1);
  block(-3.75, -11.75, 0.95, 0.85);

  box(-6, 16.5, 2, 5.2, 0.7, 1.5, 0, 0, 5, [1, 0.97, 0.93], 0);
  box(8.5, 18, -1, 3.6, 0.55, 1.3, 0.2, 0, 5, [1, 0.95, 0.9], 0);
  box(-2, 20, 14, 4.4, 0.6, 1.4, 0, 0, 5, [1, 0.96, 0.92], 0);

  var dash;
  for (dash = 0; dash < 8; dash++) {
    box(0, 0.09, 11 + dash * 4.2, 0.16, 0.03, 1.1, 0, 0, 0, [0.9, 0.88, 0.8], 0);
  }
}

function tower(ox, oz) {
  var H = 12.4;
  var cols = 8;
  var segs = 12;
  var conc = [0.95, 0.93, 0.88];
  var i, s, t0, t1, y0, y1, r0, r1, a0, a1, twist = 2.35;
  var x0, z0, x1, z1, dx, dy, dz, len, yaw, pitch;
  function rad(t) { return 0.55 + 2.15 * Math.pow(t * 2 - 1, 2); }
  for (i = 0; i < cols; i++) {
    for (s = 0; s < segs; s++) {
      t0 = s / segs; t1 = (s + 1) / segs;
      y0 = 0.4 + t0 * H; y1 = 0.4 + t1 * H;
      r0 = rad(t0); r1 = rad(t1);
      a0 = (i / cols) * Math.PI * 2 + twist * t0;
      a1 = (i / cols) * Math.PI * 2 + twist * t1;
      x0 = Math.cos(a0) * r0; z0 = Math.sin(a0) * r0;
      x1 = Math.cos(a1) * r1; z1 = Math.sin(a1) * r1;
      dx = x1 - x0; dy = y1 - y0; dz = z1 - z0;
      len = Math.hypot(dx, dy, dz) || 1;
      yaw = Math.atan2(dx, dz);
      pitch = Math.atan2(Math.hypot(dx, dz), dy);
      box(ox + (x0 + x1) * 0.5, (y0 + y1) * 0.5, oz + (z0 + z1) * 0.5, 0.2, len * 1.08, 0.2, yaw, pitch, 0, conc, 0);
    }
  }
  var rings = [0.02, 0.22, 0.5, 0.78, 0.98];
  for (s = 0; s < rings.length; s++) {
    var t = rings[s];
    var y = 0.4 + t * H;
    var r = rad(t) + 0.28;
    var hot = Math.abs(t - 0.5) < 0.06;
    box(ox, y, oz, r * 2, hot ? 0.42 : 0.22, r * 2, 0, 0, hot ? 4 : 0, hot ? [1, 0.28, 0.34] : conc, hot ? 1 : 0);
  }
  box(ox, H + 1.3, oz, 0.14, 2.4, 0.14, 0, 0, 0, conc, 0);
  box(ox, H + 2.6, oz, 0.32, 0.32, 0.32, 0, 0, 4, [1, 0.25, 0.3], 1);
}

function tree(x, z, h) {
  box(x, h * 0.38, z, 0.24, h * 0.76, 0.24, 0, 0, 0, [0.4, 0.26, 0.16], 0);
  box(x, h * 0.95, z, 1.35, 0.95, 1.35, 0, 0, 3, [0.18, 0.5, 0.26], 0);
  box(x + 0.15, h * 1.25, z + 0.05, 0.95, 0.7, 0.9, 0.4, 0, 3, [0.32, 0.66, 0.34], 0);
  block(x, z, 0.28, 0.28);
}
function lamp(x, z) {
  box(x, 1.25, z, 0.08, 2.5, 0.08, 0, 0, 0, [0.32, 0.3, 0.28], 0);
  box(x, 2.55, z, 0.22, 0.18, 0.22, 0, 0, 4, [1, 0.78, 0.42], 1);
}
function hill(x, z) {
  box(x, 1.3, z, 9, 2.6, 7, 0, 0, 3, [0.42, 0.58, 0.3], 0);
  box(x + 0.6, 2.8, z - 0.4, 5.5, 1.5, 4.2, 0, 0, 3, [0.52, 0.68, 0.36], 0);
  box(x - 0.2, 3.7, z, 2.6, 0.7, 2.2, 0, 0, 0, [0.94, 0.95, 0.93], 0.15);
}
function goat(x, z, yaw) {
  var c = Math.cos(yaw), s = Math.sin(yaw);
  var fur = [0.96, 0.94, 0.9];
  box(x, 0.32, z, 0.52, 0.3, 0.28, yaw, 0, 0, fur, 0);
  box(x + s * 0.28, 0.52, z + c * 0.28, 0.22, 0.2, 0.24, yaw, 0, 0, fur, 0);
  box(x, 0.1, z, 0.46, 0.12, 0.2, yaw, 0, 0, [0.9, 0.88, 0.82], 0);
}

function person(x, y, z, yaw, phase, moving, air, skin, hair, shirt, pants, hat) {
  var swing = Math.sin(phase) * (moving ? 0.62 : 0.08);
  var bob = moving ? Math.abs(Math.sin(phase * 2)) * -0.045 : Math.sin(phase) * 0.02;
  var yy = y + bob + (air ? 0.04 : 0);
  var c = Math.cos(yaw), s = Math.sin(yaw);
  function place(lx, ly, lz, sx, sy, sz, pitch, rgb, kind, emit) {
    dbox(x + c * lx + s * lz, yy + ly, z - s * lx + c * lz, sx, sy, sz, yaw, pitch, kind || 0, rgb, emit || 0);
  }
  var leg = air ? 0.45 : swing;
  place(-0.15, 0.34, 0, 0.16, 0.62, 0.18, leg, pants, 0, 0);
  place(0.15, 0.34, 0, 0.16, 0.62, 0.18, -leg, pants, 0, 0);
  place(-0.15, 0.07, air ? -0.04 : Math.sin(phase) * 0.05, 0.18, 0.1, 0.26, 0, SHOE, 0, 0);
  place(0.15, 0.07, air ? 0.04 : -Math.sin(phase) * 0.05, 0.18, 0.1, 0.26, 0, SHOE, 0, 0);
  place(0, 0.86, 0, 0.48, 0.46, 0.28, moving ? swing * 0.06 : 0, shirt, 0, 0);
  place(-0.34, 0.86, 0, 0.13, 0.42, 0.13, air ? -0.9 : -swing, skin, 0, 0);
  place(0.34, 0.86, 0, 0.13, 0.42, 0.13, air ? -0.9 : swing, skin, 0, 0);
  place(0, 1.28, 0, 0.38, 0.36, 0.36, 0, skin, 0, 0);
  place(0, 1.44, -0.02, 0.42, 0.16, 0.4, 0, hair, 0, 0);
  place(-0.09, 1.3, 0.17, 0.07, 0.07, 0.05, 0, [0.08, 0.06, 0.07], 0, 0);
  place(0.09, 1.3, 0.17, 0.07, 0.07, 0.05, 0, [0.08, 0.06, 0.07], 0, 0);
  if (hat === "cap") {
    place(0, 1.5, 0.02, 0.44, 0.12, 0.44, 0, HATCOL, 0, 0);
    place(0, 1.46, 0.22, 0.36, 0.05, 0.18, 0.25, HATCOL, 0, 0);
  } else if (hat === "straw") {
    place(0, 1.5, 0, 0.72, 0.05, 0.72, 0, [0.86, 0.72, 0.36], 0, 0);
    place(0, 1.62, 0, 0.32, 0.16, 0.32, 0, [0.9, 0.76, 0.4], 0, 0);
  } else if (hat === "beret") {
    place(0, 1.5, 0, 0.48, 0.1, 0.48, 0.2, [0.55, 0.12, 0.18], 0, 0);
  }
}

function fillDynamic() {
  dynCount = 0;
  var skin = PAL.skin[look.skin];
  var hair = PAL.hair[look.hair];
  var shirt = PAL.shirt[look.shirt];
  var pants = PAL.pants[look.pants];
  var moving = Math.hypot(joyX, joyY) > 0.12 || keyMove();
  person(P.x, P.y + 0.02, P.z, P.facing, P.phase, moving, !P.grounded, skin, hair, shirt, pants, look.hat);
  var shadow = 1 / (1 + P.y * 0.45);
  dbox(P.x, 0.07, P.z, 0.7 * shadow, 0.035, 0.46 * shadow, P.facing, 0, 0, [0.25, 0.16, 0.1], 0);
  var n, npc, sp, mv;
  for (n = 0; n < npcs.length; n++) {
    npc = npcs[n];
    sp = Math.abs(npc.speed) > 0.2;
    mv = true;
    person(npc.x, 0.02, npc.z, npc.dir > 0 ? 0 : Math.PI, npc.phase, mv, false,
      PAL.skin[npc.skin], PAL.hair[npc.hair], PAL.shirt[npc.shirt], PAL.pants[npc.pants], npc.hat);
  }
  var c, hue;
  for (c = 0; c < cars.length; c++) {
    hue = cars[c].col;
    var yaw = cars[c].speed >= 0 ? 0 : Math.PI;
    dbox(cars[c].x, 0.38, cars[c].z, 0.7, 0.36, 1.25, yaw, 0, 0, hue, 0);
    dbox(cars[c].x, 0.68, cars[c].z - (cars[c].speed >= 0 ? 0.05 : -0.05), 0.6, 0.28, 0.55, yaw, 0, 0, [0.75, 0.88, 0.92], 0.15);
  }
  var by = 0.28;
  dbox(boatX, by, 1.6, 0.7, 0.28, 1.7, 0, 0, 0, [0.9, 0.9, 0.86], 0);
  dbox(boatX, by + 0.38, 1.85, 0.5, 0.32, 0.55, 0, 0, 1, [0.85, 0.28, 0.22], 0.2);
  var st, part, rgb;
  for (st = 0; st < stalls.length; st++) {
    part = stalls[st].part;
    rgb = PAL[part][look[part]];
    dbox(stalls[st].x, 0.95, stalls[st].z, 0.42, 0.42, 0.42, 0, 0, 0, rgb, 0);
  }
}

function keyMove() {
  return !!(keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight);
}

function onBridge(x, z) {
  if (z < -2.4 || z > 6.4) return false;
  if (x > -16.5 && x < -11.5) return true;
  if (x > 1.7 && x < 6.3) return true;
  return false;
}
function pushWater() {
  if (P.z <= -2 || P.z >= 6 || P.x <= -34 || P.x >= 34) return;
  if (onBridge(P.x, P.z)) return;
  var dl = P.x + 34, dr = 34 - P.x, df = P.z + 2, db = 6 - P.z;
  var m = Math.min(dl, dr, df, db);
  if (m === dl) P.x = -34;
  else if (m === dr) P.x = 34;
  else if (m === df) P.z = -2;
  else P.z = 6;
}
function pushBlocks() {
  var pass, i, o, minx, maxx, minz, maxz, dl, dr, df, db, m;
  for (pass = 0; pass < 2; pass++) {
    for (i = 0; i < blockN; i++) {
      o = i * 4;
      minx = blocks[o]; maxx = blocks[o + 1]; minz = blocks[o + 2]; maxz = blocks[o + 3];
      if (P.x <= minx || P.x >= maxx || P.z <= minz || P.z >= maxz) continue;
      dl = P.x - minx; dr = maxx - P.x; df = P.z - minz; db = maxz - P.z;
      m = Math.min(dl, dr, df, db);
      if (m === dl) P.x = minx;
      else if (m === dr) P.x = maxx;
      else if (m === df) P.z = minz;
      else P.z = maxz;
    }
  }
}

function tick(dt) {
  var jx = joyX, jy = -joyY;
  if (jx === 0 && jy === 0) {
    if (keys.KeyA || keys.ArrowLeft) jx -= 1;
    if (keys.KeyD || keys.ArrowRight) jx += 1;
    if (keys.KeyW || keys.ArrowUp) jy += 1;
    if (keys.KeyS || keys.ArrowDown) jy -= 1;
  }
  var mag = Math.hypot(jx, jy);
  var moving = mag > 0.12;
  if (moving) {
    var k = Math.min(1, (mag - 0.12) / 0.88);
    if (k < 0) k = 0;
    var spd = (P.run ? 8.5 : 4.2) * (mag > 1 ? k : Math.max(k, mag));
    if (mag > 1) spd = (P.run ? 8.5 : 4.2);
    else spd = (P.run ? 8.5 : 4.2) * Math.min(1, Math.max(0, (mag - 0.12) / 0.88));
    var nx = jx / mag, nz = jy / mag;
    var s = Math.sin(camYaw), c = Math.cos(camYaw);
    var vx = s * nz + c * nx;
    var vz = c * nz - s * nx;
    P.x += vx * spd * dt;
    P.z += vz * spd * dt;
    var target = Math.atan2(vx, vz);
    var diff = target - P.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    P.facing += diff * Math.min(1, dt * 12);
    P.phase += spd * dt * 2.5;
    var st = (P.phase / Math.PI) | 0;
    if (P.grounded && st !== lastStep) { lastStep = st; stepSound(); }
  } else if (!touched) {
    P.facing = START.yaw + Math.sin(time * 0.8) * 0.16;
    P.phase += dt * 1.5;
  } else {
    P.phase += dt * 1.2;
  }
  pushWater();
  pushBlocks();
  if (P.x < -32) P.x = -32;
  if (P.x > 32) P.x = 32;
  if (P.z < -34) P.z = -34;
  if (P.z > 58) P.z = 58;
  if (jumpQueued && P.grounded) {
    P.vy = 7.8;
    P.grounded = false;
    jumpSound();
  }
  jumpQueued = false;
  P.vy -= 24 * dt;
  P.y += P.vy * dt;
  if (P.y <= 0) { P.y = 0; P.vy = 0; P.grounded = true; }

  var n, npc;
  for (n = 0; n < npcs.length; n++) {
    npc = npcs[n];
    npc.x += npc.dir * npc.speed * dt;
    if (npc.dir > 0 && npc.x > npc.max) npc.dir = -1;
    if (npc.dir < 0 && npc.x < npc.min) npc.dir = 1;
    npc.phase += dt * 3.2;
  }
  var c;
  for (c = 0; c < cars.length; c++) {
    cars[c].z += cars[c].speed * dt;
    if (cars[c].z > 40) cars[c].z = 8;
    if (cars[c].z < 8) cars[c].z = 40;
    var dx = P.x - cars[c].x, dz = P.z - cars[c].z;
    if (dx * dx + dz * dz < 0.85) {
      var len = Math.hypot(dx, dz) || 1;
      P.x += (dx / len) * 0.08;
      P.z += (dz / len) * 0.08;
    }
  }
  boatX += dt * 1.7;
  if (boatX > 18) boatX = -18;

  var tgt = SKY[skyName];
  var a = 1 - Math.exp(-dt * 2.4);
  lerp3(sky.top, tgt.top, a);
  lerp3(sky.mid, tgt.mid, a);
  lerp3(sky.hor, tgt.hor, a);
  lerp3(sky.fog, tgt.fog, a);
  lerp3(sky.sunCol, tgt.sunCol, a);
  lerp3(sky.light, tgt.light, a);
  sky.sun[0] += (tgt.sun[0] - sky.sun[0]) * a;
  sky.sun[1] += (tgt.sun[1] - sky.sun[1]) * a;
  sky.amb += (tgt.amb - sky.amb) * a;
  sky.glow += (tgt.glow - sky.glow) * a;
  sky.night += (tgt.night - sky.night) * a;
  if (toastUntil && time > toastUntil) {
    toastEl.classList.remove("on");
    toastUntil = 0;
  }
}
function lerp3(a, b, t) {
  a[0] += (b[0] - a[0]) * t;
  a[1] += (b[1] - a[1]) * t;
  a[2] += (b[2] - a[2]) * t;
}

function lookAt(out, eyeX, eyeY, eyeZ, cx, cy, cz) {
  var zx = eyeX - cx, zy = eyeY - cy, zz = eyeZ - cz;
  var len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  var xx = up[1] * zz - up[2] * zy;
  var xy = up[2] * zx - up[0] * zz;
  var xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;
  var yx = zy * xz - zz * xy;
  var yy = zz * xx - zx * xz;
  var yz = zx * xy - zy * xx;
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * eyeX + xy * eyeY + xz * eyeZ);
  out[13] = -(yx * eyeX + yy * eyeY + yz * eyeZ);
  out[14] = -(zx * eyeX + zy * eyeY + zz * eyeZ);
  out[15] = 1;
}
function perspective(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2);
  out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
  out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
  out[8] = 0; out[9] = 0;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[12] = 0; out[13] = 0;
  out[14] = (2 * far * near) / (near - far);
  out[15] = 0;
}
function multiply(out, a, b) {
  var i, ai0, ai1, ai2, ai3;
  for (i = 0; i < 4; i++) {
    ai0 = a[i]; ai1 = a[i + 4]; ai2 = a[i + 8]; ai3 = a[i + 12];
    out[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
    out[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
    out[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
    out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
  }
}

function resize() {
  var cw = canvas.clientWidth | 0;
  var ch = canvas.clientHeight | 0;
  if (cw < 2 || ch < 2) return false;
  viewW = cw; viewH = ch;
  if (cw === lastCssW && ch === lastCssH && canvas.width > 0) return true;
  lastCssW = cw; lastCssH = ch;
  var dpr = window.devicePixelRatio || 1;
  if (dpr > 2) dpr = 2;
  var w = Math.round(cw * dpr);
  var h = Math.round(ch * dpr);
  var long = w > h ? w : h;
  if (long > longCap) {
    var k = longCap / long;
    w = Math.max(2, Math.round(w * k));
    h = Math.max(2, Math.round(h * k));
  }
  canvas.width = w;
  canvas.height = h;
  bufW = w; bufH = h;
  if (gl) gl.viewport(0, 0, w, h);
  return true;
}

function render() {
  var dist = CAM.dist;
  var cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  var horiz = dist * cp;
  var sy = Math.sin(camYaw), cy = Math.cos(camYaw);
  eye[0] = P.x - sy * horiz;
  eye[1] = P.y + 1.35 + dist * sp;
  eye[2] = P.z - cy * horiz;
  center[0] = P.x + sy * CAM.ahead;
  center[1] = P.y + CAM.lookY;
  center[2] = P.z + cy * CAM.ahead;
  lookAt(view, eye[0], eye[1], eye[2], center[0], center[1], center[2]);
  perspective(proj, CAM.fovy, bufW / bufH, 0.08, 180);
  multiply(vp, proj, view);
  fillDynamic();
  gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, dyn);

  gl.clearColor(sky.fog[0], sky.fog[1], sky.fog[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.useProgram(skyProg);
  gl.uniform2f(uSky.res, bufW, bufH);
  gl.uniform3fv(uSky.top, sky.top);
  gl.uniform3fv(uSky.mid, sky.mid);
  gl.uniform3fv(uSky.hor, sky.hor);
  gl.uniform2fv(uSky.sun, sky.sun);
  gl.uniform3fv(uSky.sunCol, sky.sunCol);
  gl.uniform1f(uSky.night, sky.night);
  gl.bindVertexArray(vaoSky);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.useProgram(cityProg);
  gl.uniformMatrix4fv(uCity.vp, false, vp);
  gl.uniform1f(uCity.time, time);
  gl.uniform3f(uCity.cam, eye[0], eye[1], eye[2]);
  var sl = Math.hypot(sunV[0], sunV[1], sunV[2]) || 1;
  gl.uniform3f(uCity.sun, sunV[0] / sl, sunV[1] / sl, sunV[2] / sl);
  gl.uniform3fv(uCity.sunCol, sky.light);
  gl.uniform3fv(uCity.fog, sky.fog);
  gl.uniform1f(uCity.fogD, sky.night > 0.5 ? 0.028 : 0.02);
  gl.uniform1f(uCity.amb, sky.amb);
  gl.uniform1f(uCity.glow, sky.glow);
  gl.bindVertexArray(vaoWorld);
  gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, worldCount);
  gl.bindVertexArray(vaoDyn);
  gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, dynCount);
}

var CITY_VS = "#version 300 es\nlayout(location=0) in vec3 aPos;\nlayout(location=1) in vec3 aNrm;\nlayout(location=2) in vec4 aI0;\nlayout(location=3) in vec4 aI1;\nlayout(location=4) in vec4 aI2;\nlayout(location=5) in vec4 aI3;\nuniform mat4 uVP;\nuniform float uTime;\nout vec3 vWorld;\nout vec3 vNrm;\nout vec3 vCol;\nflat out float vKind;\nflat out float vEmit;\nvoid main(){\nvec3 center=aI0.xyz; float yaw=aI0.w; vec3 size=aI1.xyz; float pitch=aI1.w;\nfloat kind=aI2.w;\nif(kind>4.5&&kind<5.5){center.x+=sin(uTime*0.12+center.z)*1.6;}\nvec3 p=aPos*size; vec3 n=aNrm;\nfloat cp=cos(pitch), sp=sin(pitch), cy=cos(yaw), sy=sin(yaw);\nvec3 p1=vec3(p.x, cp*p.y-sp*p.z, sp*p.y+cp*p.z);\nvec3 n1=vec3(n.x, cp*n.y-sp*n.z, sp*n.y+cp*n.z);\nvec3 p2=vec3(cy*p1.x+sy*p1.z, p1.y, -sy*p1.x+cy*p1.z);\nvec3 n2=vec3(cy*n1.x+sy*n1.z, n1.y, -sy*n1.x+cy*n1.z);\nvec3 world=p2+center;\nvWorld=world; vNrm=n2; vCol=aI2.rgb; vKind=kind; vEmit=aI3.x;\ngl_Position=uVP*vec4(world,1.0);\n}\n";

var CITY_FS = "#version 300 es\nprecision highp float;\nin vec3 vWorld; in vec3 vNrm; in vec3 vCol;\nflat in float vKind; flat in float vEmit;\nuniform vec3 uCam; uniform vec3 uSun; uniform vec3 uSunColor; uniform vec3 uFogColor;\nuniform float uFogDensity; uniform float uAmbient; uniform float uGlow; uniform float uTime;\nout vec4 oColor;\nvoid main(){\nvec3 n=normalize(vNrm); vec3 wp=vWorld; float kind=vKind; vec3 col=vCol;\nfloat wrap=clamp(dot(n,uSun)*0.55+0.5,0.0,1.0);\nfloat hemi=n.y*0.5+0.5;\nvec3 skyAmb=mix(vec3(0.72,0.55,0.42), vec3(0.78,0.86,0.98), hemi);\nvec3 lit=col*(skyAmb*uAmbient+uSunColor*wrap*0.95);\nif(kind<0.5 && n.y>0.7 && wp.y<0.35){\n vec2 cell=floor(wp.xz*0.42); vec2 g=fract(wp.xz*0.42);\n float seam=max(step(g.x,0.05)+step(0.95,g.x), step(g.y,0.05)+step(0.95,g.y));\n float alt=mod(cell.x+cell.y,2.0);\n lit*=mix(vec3(1.0), vec3(0.86,0.74,0.58), alt*0.55);\n lit*=mix(1.0,0.7,clamp(seam,0.0,1.0));\n} else if(kind>0.5&&kind<1.5){\n if(n.y<0.55){\n  vec2 fw=abs(n.x)>abs(n.z)?wp.zy:wp.xy;\n  vec2 g=fract(fw*1.35);\n  float win=step(0.22,g.x)*step(g.x,0.78)*step(0.2,g.y)*step(g.y,0.78);\n  float above=step(1.15,wp.y);\n  float hsh=fract(sin(dot(floor(wp.xz*0.35),vec2(19.1,73.7)))*43758.5453);\n  lit+=vec3(1.0,0.78,0.42)*win*above*step(0.4,hsh)*uGlow*(0.4+vEmit);\n  if(wp.y<1.12) lit*=0.58;\n } else { lit*=vec3(0.9,0.88,0.84); }\n lit*=mix(0.8,1.0,smoothstep(0.0,2.2,wp.y));\n} else if(kind>1.5&&kind<2.5){\n float rip=sin(wp.x*0.9+uTime*1.3)*sin(wp.z*0.7-uTime);\n vec3 water=mix(vec3(0.04,0.32,0.4), vec3(0.98,0.68,0.34), 0.22+rip*0.16);\n water+=vec3(0.55,0.75,0.8)*smoothstep(0.4,0.95,rip)*0.28;\n lit=water*(0.72+0.4*wrap);\n} else if(kind>2.5&&kind<3.5){\n lit*=vec3(0.86,1.08,0.8)*(0.75+0.35*hemi);\n} else if(kind>3.5&&kind<4.5){\n float pulse=0.75+0.25*sin(uTime*2.4+wp.y*0.8+wp.x);\n lit=col*(0.85+pulse*0.75);\n} else if(kind>4.5&&kind<5.5){\n lit=col*(0.92+0.08*hemi);\n}\nfloat dist=length(wp-uCam);\nfloat fog=1.0-exp(-dist*uFogDensity);\nlit=mix(lit,uFogColor,clamp(fog,0.0,1.0));\noColor=vec4(lit,1.0);\n}\n";

var SKY_VS = "#version 300 es\nlayout(location=0) in vec2 aPos;\nvoid main(){ gl_Position=vec4(aPos,1.0,1.0); }\n";
var SKY_FS = "#version 300 es\nprecision highp float;\nuniform vec2 uRes; uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor;\nuniform vec2 uSun; uniform vec3 uSunCol; uniform float uNight;\nout vec4 oColor;\nvoid main(){\nvec2 uv=gl_FragCoord.xy/uRes; float h=uv.y;\nvec3 col=mix(uHor,uMid,smoothstep(0.0,0.5,h));\ncol=mix(col,uTop,smoothstep(0.48,1.0,h));\nfloat d=length(uv-uSun);\ncol+=uSunCol*smoothstep(0.16,0.0,d);\ncol+=uSunCol*smoothstep(0.42,0.0,d)*0.35;\nif(uNight>0.5 && h>0.48){\n vec2 sp=floor(gl_FragCoord.xy*0.32);\n float n=fract(sin(dot(sp,vec2(127.1,311.7)))*43758.5453);\n if(n>0.992) col+=0.9;\n}\noColor=vec4(col,1.0);\n}\n";

function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}
function program(vs, fs) {
  var p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  return p;
}
function cubeMesh() {
  var faces = [
    [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5], [0, 1, 0]],
    [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5], [0, -1, 0]],
    [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [1, 0, 0]],
    [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5], [-1, 0, 0]],
    [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5], [0, 0, 1]],
    [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0, 0, -1]]
  ];
  var data = [], ind = [], v = 0, f, i, nrm;
  for (f = 0; f < faces.length; f++) {
    nrm = faces[f][4];
    for (i = 0; i < 4; i++) data.push(faces[f][i][0], faces[f][i][1], faces[f][i][2], nrm[0], nrm[1], nrm[2]);
    ind.push(v, v + 1, v + 2, v, v + 2, v + 3);
    v += 4;
  }
  return { data: new Float32Array(data), ind: new Uint16Array(ind) };
}
function bindInstances(buf) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  var stride = 64, i;
  for (i = 0; i < 4; i++) {
    gl.enableVertexAttribArray(2 + i);
    gl.vertexAttribPointer(2 + i, 4, gl.FLOAT, false, stride, i * 16);
    gl.vertexAttribDivisor(2 + i, 1);
  }
}

function initGl() {
  gl = canvas.getContext("webgl2", {
    alpha: false, antialias: false, depth: true, stencil: false,
    powerPreference: "high-performance", preserveDrawingBuffer: false
  });
  if (!gl) return false;
  var dbg = gl.getExtension("WEBGL_debug_renderer_info");
  if (dbg) {
    var r = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
    if (/swiftshader|llvmpipe|software/i.test(r)) longCap = 560;
  }
  cityProg = program(CITY_VS, CITY_FS);
  skyProg = program(SKY_VS, SKY_FS);
  uCity.vp = gl.getUniformLocation(cityProg, "uVP");
  uCity.time = gl.getUniformLocation(cityProg, "uTime");
  uCity.cam = gl.getUniformLocation(cityProg, "uCam");
  uCity.sun = gl.getUniformLocation(cityProg, "uSun");
  uCity.sunCol = gl.getUniformLocation(cityProg, "uSunColor");
  uCity.fog = gl.getUniformLocation(cityProg, "uFogColor");
  uCity.fogD = gl.getUniformLocation(cityProg, "uFogDensity");
  uCity.amb = gl.getUniformLocation(cityProg, "uAmbient");
  uCity.glow = gl.getUniformLocation(cityProg, "uGlow");
  uSky.res = gl.getUniformLocation(skyProg, "uRes");
  uSky.top = gl.getUniformLocation(skyProg, "uTop");
  uSky.mid = gl.getUniformLocation(skyProg, "uMid");
  uSky.hor = gl.getUniformLocation(skyProg, "uHor");
  uSky.sun = gl.getUniformLocation(skyProg, "uSun");
  uSky.sunCol = gl.getUniformLocation(skyProg, "uSunCol");
  uSky.night = gl.getUniformLocation(skyProg, "uNight");

  var mesh = cubeMesh();
  var cubeBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
  var indexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.ind, gl.STATIC_DRAW);

  buildWorld();
  var world = new Float32Array(worldList);
  worldCount = world.length / 16;
  worldList = null;
  var worldBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, worldBuf);
  gl.bufferData(gl.ARRAY_BUFFER, world, gl.STATIC_DRAW);
  dynBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
  gl.bufferData(gl.ARRAY_BUFFER, dyn, gl.DYNAMIC_DRAW);

  function makeVao(inst) {
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    bindInstances(inst);
    gl.bindVertexArray(null);
    return vao;
  }
  vaoWorld = makeVao(worldBuf);
  vaoDyn = makeVao(dynBuf);
  vaoSky = gl.createVertexArray();
  gl.bindVertexArray(vaoSky);
  var tri = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tri);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.cullFace(gl.BACK);
  gl.depthFunc(gl.LEQUAL);
  return true;
}

function project(wx, wy, wz) {
  var x = vp[0] * wx + vp[4] * wy + vp[8] * wz + vp[12];
  var y = vp[1] * wx + vp[5] * wy + vp[9] * wz + vp[13];
  var w = vp[3] * wx + vp[7] * wy + vp[11] * wz + vp[15];
  if (w <= 0.05) return null;
  return [(x / w * 0.5 + 0.5) * viewW, (0.5 - y / w * 0.5) * viewH];
}

function showActs() {
  if (acts.classList.contains("on")) return;
  acts.classList.add("on");
  acts.setAttribute("aria-hidden", "false");
}
function say(text) {
  toastEl.textContent = text;
  toastEl.classList.add("on");
  toastUntil = time + 1.8;
}
function takePhoto() {
  flashEl.classList.remove("go");
  void flashEl.offsetWidth;
  flashEl.classList.add("go");
  shutter();
  var fx = Math.sin(camYaw), fz = Math.cos(camYaw);
  var best = null, bestD = 1e9, i, s, dx, dz, d, dot;
  for (i = 0; i < STAMPS.length; i++) {
    s = STAMPS[i];
    dx = s.x - P.x; dz = s.z - P.z;
    d = Math.hypot(dx, dz);
    if (d > s.r || d >= bestD) continue;
    if (d > 5) {
      dot = (dx * fx + dz * fz) / (d || 1);
      if (dot < 0.2) continue;
    }
    best = s; bestD = d;
  }
  if (!best) { say("再走近一点"); return; }
  if (got[best.id]) { say(best.zh + " · 已收录"); return; }
  got[best.id] = 1;
  gotN++;
  var li = document.createElement("li");
  li.textContent = best.zh + " · " + best.en;
  album.appendChild(li);
  say(gotN === 8 ? "羊城旅行家" : best.zh + "  " + gotN + "/8");
}
function cyclePart(part) {
  if (part === "hat") {
    var i = HATS.indexOf(look.hat);
    look.hat = HATS[(i + 1) % HATS.length];
    markHats();
    return;
  }
  look[part] = (look[part] + 1) % PAL[part].length;
  markRow(part);
}
function markRow(part) {
  var row = document.getElementById("row-" + part);
  if (!row) return;
  var buttons = row.children, i;
  for (i = 0; i < buttons.length; i++) buttons[i].classList.toggle("is-on", i === look[part]);
}
function markHats() {
  var row = document.getElementById("row-hat");
  var buttons = row.children, i;
  for (i = 0; i < buttons.length; i++) buttons[i].classList.toggle("is-on", buttons[i].getAttribute("data-hat") === look.hat);
}
function buildDress() {
  var parts = ["skin", "hair", "shirt", "pants"], p, row, i, b, rgb;
  for (p = 0; p < parts.length; p++) {
    row = document.getElementById("row-" + parts[p]);
    for (i = 0; i < PAL[parts[p]].length; i++) {
      b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (i === look[parts[p]] ? " is-on" : "");
      rgb = PAL[parts[p]][i];
      b.style.background = "rgb(" + (rgb[0] * 255 | 0) + "," + (rgb[1] * 255 | 0) + "," + (rgb[2] * 255 | 0) + ")";
      b.setAttribute("data-part", parts[p]);
      b.setAttribute("data-i", String(i));
      b.addEventListener("pointerdown", onSwatch);
      row.appendChild(b);
    }
  }
  var labels = ["无", "帽", "笠", "贝雷"];
  row = document.getElementById("row-hat");
  for (i = 0; i < HATS.length; i++) {
    b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (HATS[i] === look.hat ? " is-on" : "");
    b.textContent = labels[i];
    b.setAttribute("data-hat", HATS[i]);
    b.addEventListener("pointerdown", onHat);
    row.appendChild(b);
  }
  var skies = [["dawn", "清晨"], ["dusk", "黄昏"], ["night", "夜色"]];
  row = document.getElementById("row-sky");
  for (i = 0; i < skies.length; i++) {
    b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (skies[i][0] === skyName ? " is-on" : "");
    b.textContent = skies[i][1];
    b.setAttribute("data-sky", skies[i][0]);
    b.addEventListener("pointerdown", onSky);
    row.appendChild(b);
  }
}
function onSwatch(e) {
  e.stopPropagation();
  e.preventDefault();
  var part = e.currentTarget.getAttribute("data-part");
  look[part] = parseInt(e.currentTarget.getAttribute("data-i"), 10) || 0;
  markRow(part);
}
function onHat(e) {
  e.stopPropagation();
  e.preventDefault();
  look.hat = e.currentTarget.getAttribute("data-hat");
  markHats();
}
function onSky(e) {
  e.stopPropagation();
  e.preventDefault();
  skyName = e.currentTarget.getAttribute("data-sky");
  var row = document.getElementById("row-sky");
  var buttons = row.children, i;
  for (i = 0; i < buttons.length; i++) buttons[i].classList.toggle("is-on", buttons[i].getAttribute("data-sky") === skyName);
}

function unlockAudio() {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!actx) {
    try {
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.12;
      master.connect(actx.destination);
      var a = actx.createOscillator();
      var b = actx.createOscillator();
      var g = actx.createGain();
      a.type = "sine"; b.type = "sine";
      a.frequency.value = 174.61;
      b.frequency.value = 261.63;
      g.gain.value = 0.028;
      a.connect(g); b.connect(g); g.connect(master);
      a.start(); b.start();
      var nlen = (actx.sampleRate * 0.05) | 0;
      noiseBuf = actx.createBuffer(1, nlen, actx.sampleRate);
      var data = noiseBuf.getChannelData(0), i;
      for (i = 0; i < nlen; i++) {
        var env = 1 - i / nlen;
        data[i] = (Math.random() * 2 - 1) * env * env;
      }
    } catch (err) { actx = null; }
  }
  if (actx && actx.state === "suspended") actx.resume();
}
function noiseBurst(rate, gain) {
  if (!actx || !noiseBuf || !master) return;
  var src = actx.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = rate;
  var g = actx.createGain();
  g.gain.value = gain;
  src.connect(g); g.connect(master);
  src.start();
}
function tone(freq, dur, type, gain) {
  if (!actx || !master) return;
  var o = actx.createOscillator();
  var g = actx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  o.connect(g); g.connect(master);
  o.start();
  o.stop(actx.currentTime + dur);
}
function stepSound() { noiseBurst(1.6, 0.08); }
function jumpSound() { tone(320, 0.12, "square", 0.04); }
function shutter() { noiseBurst(0.45, 0.22); tone(880, 0.06, "sine", 0.05); }

var slots = [
  { id: -1, zone: 0, x: 0, y: 0, ox: 0, oy: 0, moved: 0 },
  { id: -1, zone: 0, x: 0, y: 0, ox: 0, oy: 0, moved: 0 },
  { id: -1, zone: 0, x: 0, y: 0, ox: 0, oy: 0, moved: 0 }
];
function slotFor(id) {
  var i, free = null;
  for (i = 0; i < slots.length; i++) {
    if (slots[i].id === id) return slots[i];
    if (slots[i].id < 0 && !free) free = slots[i];
  }
  return free || slots[0];
}
function updateJoy() {
  var i, s, joy = null;
  for (i = 0; i < slots.length; i++) if (slots[i].id >= 0 && slots[i].zone === 1) joy = slots[i];
  stick.classList.toggle("on", !!joy);
  if (!joy) { joyX = 0; joyY = 0; return; }
  var dx = joy.x - joy.ox, dy = joy.y - joy.oy;
  var maxR = 42;
  var len = Math.hypot(dx, dy);
  if (len > maxR && len > 0) { dx *= maxR / len; dy *= maxR / len; }
  joyX = dx / maxR;
  joyY = dy / maxR;
  knob.style.transform = "translate(" + dx + "px," + dy + "px)";
  stick.style.left = joy.ox + "px";
  stick.style.top = joy.oy + "px";
}
function localXY(e) {
  var r = stage.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}
function onDown(e) {
  if (e.target && e.target.closest && e.target.closest("#gear, #sheet, #acts")) return;
  e.preventDefault();
  touched = true;
  showActs();
  unlockAudio();
  var pt = localXY(e);
  var s = slotFor(e.pointerId);
  s.id = e.pointerId;
  s.x = pt[0]; s.y = pt[1]; s.ox = pt[0]; s.oy = pt[1]; s.moved = 0;
  s.zone = pt[0] < viewW * 0.46 ? 1 : 2;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  updateJoy();
}
function onMove(e) {
  var s = null, i;
  for (i = 0; i < slots.length; i++) if (slots[i].id === e.pointerId) s = slots[i];
  if (!s) return;
  var pt = localXY(e);
  var dx = pt[0] - s.x, dy = pt[1] - s.y;
  s.moved += Math.abs(dx) + Math.abs(dy);
  s.x = pt[0]; s.y = pt[1];
  if (s.zone === 2) {
    camYaw -= dx * 0.0072;
    camPitch += dy * 0.0052;
    if (camPitch < 0.18) camPitch = 0.18;
    if (camPitch > 1.12) camPitch = 1.12;
  }
  updateJoy();
}
function onUp(e) {
  var s = null, i;
  for (i = 0; i < slots.length; i++) if (slots[i].id === e.pointerId) s = slots[i];
  if (!s) return;
  if (s.moved < 12 && s.zone === 2) tryStall(s.x, s.y);
  s.id = -1;
  updateJoy();
}
function tryStall(px, py) {
  var i, pr, dx, dz, d, best = null, bestPix = 36;
  for (i = 0; i < stalls.length; i++) {
    dx = stalls[i].x - P.x; dz = stalls[i].z - P.z;
    if (dx * dx + dz * dz > 49) continue;
    pr = project(stalls[i].x, 0.95, stalls[i].z);
    if (!pr) continue;
    d = Math.hypot(pr[0] - px, pr[1] - py);
    if (d < bestPix) { bestPix = d; best = stalls[i]; }
  }
  if (best) cyclePart(best.part);
}

function swallow(el) {
  var evs = ["pointerdown", "pointermove", "pointerup", "touchstart", "touchmove", "touchend", "mousedown", "click", "wheel"];
  var i;
  for (i = 0; i < evs.length; i++) el.addEventListener(evs[i], function (e) { e.stopPropagation(); });
}

function bootUi() {
  buildDress();
  swallow(gear);
  swallow(sheet);
  swallow(acts);
  gear.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = sheet.hasAttribute("hidden");
    if (open) sheet.removeAttribute("hidden");
    else sheet.setAttribute("hidden", "");
    gear.setAttribute("aria-expanded", open ? "true" : "false");
  });
  jumpBtn.addEventListener("pointerdown", function (e) {
    e.preventDefault(); e.stopPropagation();
    touched = true; showActs(); unlockAudio();
    jumpQueued = true;
  });
  runBtn.addEventListener("pointerdown", function (e) {
    e.preventDefault(); e.stopPropagation();
    touched = true; showActs(); unlockAudio();
    P.run = !P.run;
    runBtn.classList.toggle("is-on", P.run);
    runBtn.setAttribute("aria-pressed", P.run ? "true" : "false");
  });
  shotBtn.addEventListener("pointerdown", function (e) {
    e.preventDefault(); e.stopPropagation();
    touched = true; showActs(); unlockAudio();
    takePhoto();
  });
  canvas.addEventListener("pointerdown", onDown, { passive: false });
  canvas.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    touched = true; showActs();
    if (e.code === "Space") { jumpQueued = true; e.preventDefault(); }
    if (e.code === "KeyC") takePhoto();
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      P.run = !P.run;
      runBtn.classList.toggle("is-on", P.run);
    }
  });
  window.addEventListener("keyup", function (e) { keys[e.code] = false; });
  window.addEventListener("resize", function () { lastCssW = 0; });
  window.addEventListener("contextmenu", function (e) { e.preventDefault(); });
}

function markReady() {
  if (sent) return;
  if (window.__gbSandbox && typeof window.__gbSandbox.ready === "function") {
    sent = true;
    window.__gbSandbox.ready();
  }
}

var acc = 0;
var lastNow = 0;
function loop(now) {
  if (!lastNow) lastNow = now;
  var dt = (now - lastNow) / 1000;
  lastNow = now;
  if (dt > 0.08) dt = 0.08;
  if (dt < 0) dt = 0;
  if (!resize()) { requestAnimationFrame(loop); return; }
  acc += dt;
  var steps = 0;
  while (acc >= 1 / 60 && steps < 4) {
    time += 1 / 60;
    tick(1 / 60);
    acc -= 1 / 60;
    steps++;
  }
  render();
  painted++;
  if (painted >= 2) markReady();
  requestAnimationFrame(loop);
}

bootUi();
if (!initGl()) {
  canvas.style.background = "#e7a15a";
} else {
  requestAnimationFrame(loop);
}
