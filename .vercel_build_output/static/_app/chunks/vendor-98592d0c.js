function g() {}
const P = (e) => e;
function ke(e, t) {
	for (const n in t) e[n] = t[n];
	return e;
}
function K(e) {
	return e();
}
function G() {
	return Object.create(null);
}
function x(e) {
	e.forEach(K);
}
function O(e) {
	return typeof e == 'function';
}
function Z(e, t) {
	return e != e ? t == t : e !== t || (e && typeof e == 'object') || typeof e == 'function';
}
function we(e) {
	return Object.keys(e).length === 0;
}
function Oe(e, ...t) {
	if (e == null) return g;
	const n = e.subscribe(...t);
	return n.unsubscribe ? () => n.unsubscribe() : n;
}
function vt(e, t, n) {
	e.$$.on_destroy.push(Oe(t, n));
}
function Ce(e, t, n, r) {
	if (e) {
		const i = J(e, t, n, r);
		return e[0](i);
	}
}
function J(e, t, n, r) {
	return e[1] && r ? ke(n.ctx.slice(), e[1](r(t))) : n.ctx;
}
function $e(e, t, n, r) {
	if (e[2] && r) {
		const i = e[2](r(n));
		if (t.dirty === void 0) return i;
		if (typeof i == 'object') {
			const l = [],
				o = Math.max(t.dirty.length, i.length);
			for (let u = 0; u < o; u += 1) l[u] = t.dirty[u] | i[u];
			return l;
		}
		return t.dirty | i;
	}
	return t.dirty;
}
function Ie(e, t, n, r, i, l) {
	if (i) {
		const o = J(t, n, r, l);
		e.p(o, i);
	}
}
function Se(e) {
	if (e.ctx.length > 32) {
		const t = [],
			n = e.ctx.length / 32;
		for (let r = 0; r < n; r++) t[r] = -1;
		return t;
	}
	return -1;
}
function gt(e) {
	return e == null ? '' : e;
}
function Ne(e) {
	return e && O(e.destroy) ? e.destroy : g;
}
const ee = typeof window != 'undefined';
let te = ee ? () => window.performance.now() : () => Date.now(),
	W = ee ? (e) => requestAnimationFrame(e) : g;
const k = new Set();
function ne(e) {
	k.forEach((t) => {
		t.c(e) || (k.delete(t), t.f());
	}),
		k.size !== 0 && W(ne);
}
function re(e) {
	let t;
	return (
		k.size === 0 && W(ne),
		{
			promise: new Promise((n) => {
				k.add((t = { c: e, f: n }));
			}),
			abort() {
				k.delete(t);
			}
		}
	);
}
let N = !1;
function Te() {
	N = !0;
}
function Me() {
	N = !1;
}
function Ue(e, t, n, r) {
	for (; e < t; ) {
		const i = e + ((t - e) >> 1);
		n(i) <= r ? (e = i + 1) : (t = i);
	}
	return e;
}
function Re(e) {
	if (e.hydrate_init) return;
	e.hydrate_init = !0;
	let t = e.childNodes;
	if (e.nodeName === 'HEAD') {
		const a = [];
		for (let s = 0; s < t.length; s++) {
			const f = t[s];
			f.claim_order !== void 0 && a.push(f);
		}
		t = a;
	}
	const n = new Int32Array(t.length + 1),
		r = new Int32Array(t.length);
	n[0] = -1;
	let i = 0;
	for (let a = 0; a < t.length; a++) {
		const s = t[a].claim_order,
			f = (i > 0 && t[n[i]].claim_order <= s ? i + 1 : Ue(1, i, (d) => t[n[d]].claim_order, s)) - 1;
		r[a] = n[f] + 1;
		const c = f + 1;
		(n[c] = a), (i = Math.max(c, i));
	}
	const l = [],
		o = [];
	let u = t.length - 1;
	for (let a = n[i] + 1; a != 0; a = r[a - 1]) {
		for (l.push(t[a - 1]); u >= a; u--) o.push(t[u]);
		u--;
	}
	for (; u >= 0; u--) o.push(t[u]);
	l.reverse(), o.sort((a, s) => a.claim_order - s.claim_order);
	for (let a = 0, s = 0; a < o.length; a++) {
		for (; s < l.length && o[a].claim_order >= l[s].claim_order; ) s++;
		const f = s < l.length ? l[s] : null;
		e.insertBefore(o[a], f);
	}
}
function He(e, t) {
	e.appendChild(t);
}
function ie(e) {
	if (!e) return document;
	const t = e.getRootNode ? e.getRootNode() : e.ownerDocument;
	return t && t.host ? t : e.ownerDocument;
}
function Ve(e) {
	const t = q('style');
	return Le(ie(e), t), t;
}
function Le(e, t) {
	He(e.head || e, t);
}
function De(e, t) {
	if (N) {
		for (
			Re(e),
				(e.actual_end_child === void 0 ||
					(e.actual_end_child !== null && e.actual_end_child.parentElement !== e)) &&
					(e.actual_end_child = e.firstChild);
			e.actual_end_child !== null && e.actual_end_child.claim_order === void 0;

		)
			e.actual_end_child = e.actual_end_child.nextSibling;
		t !== e.actual_end_child
			? (t.claim_order !== void 0 || t.parentNode !== e) && e.insertBefore(t, e.actual_end_child)
			: (e.actual_end_child = t.nextSibling);
	} else (t.parentNode !== e || t.nextSibling !== null) && e.appendChild(t);
}
function Pe(e, t, n) {
	N && !n ? De(e, t) : (t.parentNode !== e || t.nextSibling != n) && e.insertBefore(t, n || null);
}
function j(e) {
	e.parentNode.removeChild(e);
}
function At(e, t) {
	for (let n = 0; n < e.length; n += 1) e[n] && e[n].d(t);
}
function q(e) {
	return document.createElement(e);
}
function We(e) {
	return document.createElementNS('http://www.w3.org/2000/svg', e);
}
function z(e) {
	return document.createTextNode(e);
}
function bt() {
	return z(' ');
}
function Et() {
	return z('');
}
function xt(e, t, n, r) {
	return e.addEventListener(t, n, r), () => e.removeEventListener(t, n, r);
}
function kt(e, t, n) {
	n == null ? e.removeAttribute(t) : e.getAttribute(t) !== n && e.setAttribute(t, n);
}
function ae(e) {
	return Array.from(e.childNodes);
}
function je(e) {
	e.claim_info === void 0 && (e.claim_info = { last_index: 0, total_claimed: 0 });
}
function oe(e, t, n, r, i = !1) {
	je(e);
	const l = (() => {
		for (let o = e.claim_info.last_index; o < e.length; o++) {
			const u = e[o];
			if (t(u)) {
				const a = n(u);
				return a === void 0 ? e.splice(o, 1) : (e[o] = a), i || (e.claim_info.last_index = o), u;
			}
		}
		for (let o = e.claim_info.last_index - 1; o >= 0; o--) {
			const u = e[o];
			if (t(u)) {
				const a = n(u);
				return (
					a === void 0 ? e.splice(o, 1) : (e[o] = a),
					i ? a === void 0 && e.claim_info.last_index-- : (e.claim_info.last_index = o),
					u
				);
			}
		}
		return r();
	})();
	return (l.claim_order = e.claim_info.total_claimed), (e.claim_info.total_claimed += 1), l;
}
function ue(e, t, n, r) {
	return oe(
		e,
		(i) => i.nodeName === t,
		(i) => {
			const l = [];
			for (let o = 0; o < i.attributes.length; o++) {
				const u = i.attributes[o];
				n[u.name] || l.push(u.name);
			}
			l.forEach((o) => i.removeAttribute(o));
		},
		() => r(t)
	);
}
function qe(e, t, n) {
	return ue(e, t, n, q);
}
function wt(e, t, n) {
	return ue(e, t, n, We);
}
function ze(e, t) {
	return oe(
		e,
		(n) => n.nodeType === 3,
		(n) => {
			const r = '' + t;
			if (n.data.startsWith(r)) {
				if (n.data.length !== r.length) return n.splitText(r.length);
			} else n.data = r;
		},
		() => z(t),
		!0
	);
}
function Ot(e) {
	return ze(e, ' ');
}
function Ct(e, t) {
	(t = '' + t), e.wholeText !== t && (e.data = t);
}
function $t(e, t, n) {
	e.classList[n ? 'add' : 'remove'](t);
}
function se(e, t, n = !1) {
	const r = document.createEvent('CustomEvent');
	return r.initCustomEvent(e, n, !1, t), r;
}
const B = new Set();
let T = 0;
function Be(e) {
	let t = 5381,
		n = e.length;
	for (; n--; ) t = ((t << 5) - t) ^ e.charCodeAt(n);
	return t >>> 0;
}
function le(e, t, n, r, i, l, o, u = 0) {
	const a = 16.666 / r;
	let s = `{
`;
	for (let p = 0; p <= 1; p += a) {
		const v = t + (n - t) * l(p);
		s +=
			p * 100 +
			`%{${o(v, 1 - v)}}
`;
	}
	const f =
			s +
			`100% {${o(n, 1 - n)}}
}`,
		c = `__svelte_${Be(f)}_${u}`,
		d = ie(e);
	B.add(d);
	const _ = d.__svelte_stylesheet || (d.__svelte_stylesheet = Ve(e).sheet),
		m = d.__svelte_rules || (d.__svelte_rules = {});
	m[c] || ((m[c] = !0), _.insertRule(`@keyframes ${c} ${f}`, _.cssRules.length));
	const h = e.style.animation || '';
	return (e.style.animation = `${h ? `${h}, ` : ''}${c} ${r}ms linear ${i}ms 1 both`), (T += 1), c;
}
function Y(e, t) {
	const n = (e.style.animation || '').split(', '),
		r = n.filter(t ? (l) => l.indexOf(t) < 0 : (l) => l.indexOf('__svelte') === -1),
		i = n.length - r.length;
	i && ((e.style.animation = r.join(', ')), (T -= i), T || Ye());
}
function Ye() {
	W(() => {
		T ||
			(B.forEach((e) => {
				const t = e.__svelte_stylesheet;
				let n = t.cssRules.length;
				for (; n--; ) t.deleteRule(n);
				e.__svelte_rules = {};
			}),
			B.clear());
	});
}
let M;
function U(e) {
	M = e;
}
function C() {
	if (!M) throw new Error('Function called outside component initialization');
	return M;
}
function It(e) {
	C().$$.on_mount.push(e);
}
function St(e) {
	C().$$.after_update.push(e);
}
function Nt(e) {
	C().$$.on_destroy.push(e);
}
function Tt() {
	const e = C();
	return (t, n) => {
		const r = e.$$.callbacks[t];
		if (r) {
			const i = se(t, n);
			r.slice().forEach((l) => {
				l.call(e, i);
			});
		}
	};
}
function Mt(e, t) {
	C().$$.context.set(e, t);
}
const $ = [],
	ce = [],
	R = [],
	fe = [],
	de = Promise.resolve();
let F = !1;
function he() {
	F || ((F = !0), de.then(_e));
}
function Fe() {
	return he(), de;
}
function I(e) {
	R.push(e);
}
let Q = !1;
const X = new Set();
function _e() {
	if (!Q) {
		Q = !0;
		do {
			for (let e = 0; e < $.length; e += 1) {
				const t = $[e];
				U(t), Qe(t.$$);
			}
			for (U(null), $.length = 0; ce.length; ) ce.pop()();
			for (let e = 0; e < R.length; e += 1) {
				const t = R[e];
				X.has(t) || (X.add(t), t());
			}
			R.length = 0;
		} while ($.length);
		for (; fe.length; ) fe.pop()();
		(F = !1), (Q = !1), X.clear();
	}
}
function Qe(e) {
	if (e.fragment !== null) {
		e.update(), x(e.before_update);
		const t = e.dirty;
		(e.dirty = [-1]), e.fragment && e.fragment.p(e.ctx, t), e.after_update.forEach(I);
	}
}
let S;
function me() {
	return (
		S ||
			((S = Promise.resolve()),
			S.then(() => {
				S = null;
			})),
		S
	);
}
function H(e, t, n) {
	e.dispatchEvent(se(`${t ? 'intro' : 'outro'}${n}`));
}
const V = new Set();
let b;
function Ut() {
	b = { r: 0, c: [], p: b };
}
function Rt() {
	b.r || x(b.c), (b = b.p);
}
function pe(e, t) {
	e && e.i && (V.delete(e), e.i(t));
}
function Xe(e, t, n, r) {
	if (e && e.o) {
		if (V.has(e)) return;
		V.add(e),
			b.c.push(() => {
				V.delete(e), r && (n && e.d(1), r());
			}),
			e.o(t);
	}
}
const ye = { duration: 0 };
function Ht(e, t, n) {
	let r = t(e, n),
		i = !1,
		l,
		o,
		u = 0;
	function a() {
		l && Y(e, l);
	}
	function s() {
		const { delay: c = 0, duration: d = 300, easing: _ = P, tick: m = g, css: h } = r || ye;
		h && (l = le(e, 0, 1, d, c, _, h, u++)), m(0, 1);
		const p = te() + c,
			v = p + d;
		o && o.abort(),
			(i = !0),
			I(() => H(e, !0, 'start')),
			(o = re((A) => {
				if (i) {
					if (A >= v) return m(1, 0), H(e, !0, 'end'), a(), (i = !1);
					if (A >= p) {
						const E = _((A - p) / d);
						m(E, 1 - E);
					}
				}
				return i;
			}));
	}
	let f = !1;
	return {
		start() {
			f || ((f = !0), Y(e), O(r) ? ((r = r()), me().then(s)) : s());
		},
		invalidate() {
			f = !1;
		},
		end() {
			i && (a(), (i = !1));
		}
	};
}
function Vt(e, t, n) {
	let r = t(e, n),
		i = !0,
		l;
	const o = b;
	o.r += 1;
	function u() {
		const { delay: a = 0, duration: s = 300, easing: f = P, tick: c = g, css: d } = r || ye;
		d && (l = le(e, 1, 0, s, a, f, d));
		const _ = te() + a,
			m = _ + s;
		I(() => H(e, !1, 'start')),
			re((h) => {
				if (i) {
					if (h >= m) return c(0, 1), H(e, !1, 'end'), --o.r || x(o.c), !1;
					if (h >= _) {
						const p = f((h - _) / s);
						c(1 - p, p);
					}
				}
				return i;
			});
	}
	return (
		O(r)
			? me().then(() => {
					(r = r()), u();
			  })
			: u(),
		{
			end(a) {
				a && r.tick && r.tick(1, 0), i && (l && Y(e, l), (i = !1));
			}
		}
	);
}
function Lt(e, t) {
	const n = {},
		r = {},
		i = { $$scope: 1 };
	let l = e.length;
	for (; l--; ) {
		const o = e[l],
			u = t[l];
		if (u) {
			for (const a in o) a in u || (r[a] = 1);
			for (const a in u) i[a] || ((n[a] = u[a]), (i[a] = 1));
			e[l] = u;
		} else for (const a in o) i[a] = 1;
	}
	for (const o in r) o in n || (n[o] = void 0);
	return n;
}
function Dt(e) {
	return typeof e == 'object' && e !== null ? e : {};
}
function Pt(e) {
	e && e.c();
}
function Wt(e, t) {
	e && e.l(t);
}
function Ke(e, t, n, r) {
	const { fragment: i, on_mount: l, on_destroy: o, after_update: u } = e.$$;
	i && i.m(t, n),
		r ||
			I(() => {
				const a = l.map(K).filter(O);
				o ? o.push(...a) : x(a), (e.$$.on_mount = []);
			}),
		u.forEach(I);
}
function Ge(e, t) {
	const n = e.$$;
	n.fragment !== null &&
		(x(n.on_destroy),
		n.fragment && n.fragment.d(t),
		(n.on_destroy = n.fragment = null),
		(n.ctx = []));
}
function Ze(e, t) {
	e.$$.dirty[0] === -1 && ($.push(e), he(), e.$$.dirty.fill(0)),
		(e.$$.dirty[(t / 31) | 0] |= 1 << t % 31);
}
function Je(e, t, n, r, i, l, o, u = [-1]) {
	const a = M;
	U(e);
	const s = (e.$$ = {
		fragment: null,
		ctx: null,
		props: l,
		update: g,
		not_equal: i,
		bound: G(),
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(t.context || (a ? a.$$.context : [])),
		callbacks: G(),
		dirty: u,
		skip_bound: !1,
		root: t.target || a.$$.root
	});
	o && o(s.root);
	let f = !1;
	if (
		((s.ctx = n
			? n(e, t.props || {}, (c, d, ..._) => {
					const m = _.length ? _[0] : d;
					return (
						s.ctx &&
							i(s.ctx[c], (s.ctx[c] = m)) &&
							(!s.skip_bound && s.bound[c] && s.bound[c](m), f && Ze(e, c)),
						d
					);
			  })
			: []),
		s.update(),
		(f = !0),
		x(s.before_update),
		(s.fragment = r ? r(s.ctx) : !1),
		t.target)
	) {
		if (t.hydrate) {
			Te();
			const c = ae(t.target);
			s.fragment && s.fragment.l(c), c.forEach(j);
		} else s.fragment && s.fragment.c();
		t.intro && pe(e.$$.fragment), Ke(e, t.target, t.anchor, t.customElement), Me(), _e();
	}
	U(a);
}
class et {
	$destroy() {
		Ge(this, 1), (this.$destroy = g);
	}
	$on(t, n) {
		const r = this.$$.callbacks[t] || (this.$$.callbacks[t] = []);
		return (
			r.push(n),
			() => {
				const i = r.indexOf(n);
				i !== -1 && r.splice(i, 1);
			}
		);
	}
	$set(t) {
		this.$$set && !we(t) && ((this.$$.skip_bound = !0), this.$$set(t), (this.$$.skip_bound = !1));
	}
}
const w = [];
function jt(e, t = g) {
	let n;
	const r = new Set();
	function i(u) {
		if (Z(e, u) && ((e = u), n)) {
			const a = !w.length;
			for (const s of r) s[1](), w.push(s, e);
			if (a) {
				for (let s = 0; s < w.length; s += 2) w[s][0](w[s + 1]);
				w.length = 0;
			}
		}
	}
	function l(u) {
		i(u(e));
	}
	function o(u, a = g) {
		const s = [u, a];
		return (
			r.add(s),
			r.size === 1 && (n = t(i) || g),
			u(e),
			() => {
				r.delete(s), r.size === 0 && (n(), (n = null));
			}
		);
	}
	return { set: i, update: l, subscribe: o };
}
function qt(e, { delay: t = 0, duration: n = 400, easing: r = P } = {}) {
	const i = +getComputedStyle(e).opacity;
	return { delay: t, duration: n, easing: r, css: (l) => `opacity: ${l * i}` };
}
function tt(e) {
	let t, n, r, i, l;
	const o = e[2].default,
		u = Ce(o, e, e[1], null);
	return {
		c() {
			(t = q('div')), u && u.c(), this.h();
		},
		l(a) {
			t = qe(a, 'DIV', {});
			var s = ae(t);
			u && u.l(s), s.forEach(j), this.h();
		},
		h() {
			t.hidden = !0;
		},
		m(a, s) {
			Pe(a, t, s),
				u && u.m(t, null),
				(r = !0),
				i || ((l = Ne((n = nt.call(null, t, e[0])))), (i = !0));
		},
		p(a, [s]) {
			u && u.p && (!r || s & 2) && Ie(u, o, a, a[1], r ? $e(o, a[1], s, null) : Se(a[1]), null),
				n && O(n.update) && s & 1 && n.update.call(null, a[0]);
		},
		i(a) {
			r || (pe(u, a), (r = !0));
		},
		o(a) {
			Xe(u, a), (r = !1);
		},
		d(a) {
			a && j(t), u && u.d(a), (i = !1), l();
		}
	};
}
function nt(e, t = 'body') {
	let n;
	async function r(l) {
		if (((t = l), typeof t == 'string')) {
			if (
				((n = document.querySelector(t)),
				n === null && (await Fe(), (n = document.querySelector(t))),
				n === null)
			)
				throw new Error(`No element found matching css selector: "${t}"`);
		} else if (t instanceof HTMLElement) n = t;
		else
			throw new TypeError(
				`Unknown portal target type: ${
					t === null ? 'null' : typeof t
				}. Allowed types: string (CSS selector) or HTMLElement.`
			);
		n.appendChild(e), (e.hidden = !1);
	}
	function i() {
		e.parentNode && e.parentNode.removeChild(e);
	}
	return r(t), { update: r, destroy: i };
}
function rt(e, t, n) {
	let { $$slots: r = {}, $$scope: i } = t,
		{ target: l = 'body' } = t;
	return (
		(e.$$set = (o) => {
			'target' in o && n(0, (l = o.target)), '$$scope' in o && n(1, (i = o.$$scope));
		}),
		[l, i, r]
	);
}
class zt extends et {
	constructor(t) {
		super();
		Je(this, t, rt, tt, Z, { target: 0 });
	}
}
function L() {
	return (
		(L =
			Object.assign ||
			function (e) {
				for (var t = 1; t < arguments.length; t++) {
					var n = arguments[t];
					for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
				}
				return e;
			}),
		L.apply(this, arguments)
	);
}
var D = { exports: {} },
	ve = {
		À: 'A',
		Á: 'A',
		Â: 'A',
		Ã: 'A',
		Ä: 'A',
		Å: 'A',
		Ấ: 'A',
		Ắ: 'A',
		Ẳ: 'A',
		Ẵ: 'A',
		Ặ: 'A',
		Æ: 'AE',
		Ầ: 'A',
		Ằ: 'A',
		Ȃ: 'A',
		Ç: 'C',
		Ḉ: 'C',
		È: 'E',
		É: 'E',
		Ê: 'E',
		Ë: 'E',
		Ế: 'E',
		Ḗ: 'E',
		Ề: 'E',
		Ḕ: 'E',
		Ḝ: 'E',
		Ȇ: 'E',
		Ì: 'I',
		Í: 'I',
		Î: 'I',
		Ï: 'I',
		Ḯ: 'I',
		Ȋ: 'I',
		Ð: 'D',
		Ñ: 'N',
		Ò: 'O',
		Ó: 'O',
		Ô: 'O',
		Õ: 'O',
		Ö: 'O',
		Ø: 'O',
		Ố: 'O',
		Ṍ: 'O',
		Ṓ: 'O',
		Ȏ: 'O',
		Ù: 'U',
		Ú: 'U',
		Û: 'U',
		Ü: 'U',
		Ý: 'Y',
		à: 'a',
		á: 'a',
		â: 'a',
		ã: 'a',
		ä: 'a',
		å: 'a',
		ấ: 'a',
		ắ: 'a',
		ẳ: 'a',
		ẵ: 'a',
		ặ: 'a',
		æ: 'ae',
		ầ: 'a',
		ằ: 'a',
		ȃ: 'a',
		ç: 'c',
		ḉ: 'c',
		è: 'e',
		é: 'e',
		ê: 'e',
		ë: 'e',
		ế: 'e',
		ḗ: 'e',
		ề: 'e',
		ḕ: 'e',
		ḝ: 'e',
		ȇ: 'e',
		ì: 'i',
		í: 'i',
		î: 'i',
		ï: 'i',
		ḯ: 'i',
		ȋ: 'i',
		ð: 'd',
		ñ: 'n',
		ò: 'o',
		ó: 'o',
		ô: 'o',
		õ: 'o',
		ö: 'o',
		ø: 'o',
		ố: 'o',
		ṍ: 'o',
		ṓ: 'o',
		ȏ: 'o',
		ù: 'u',
		ú: 'u',
		û: 'u',
		ü: 'u',
		ý: 'y',
		ÿ: 'y',
		Ā: 'A',
		ā: 'a',
		Ă: 'A',
		ă: 'a',
		Ą: 'A',
		ą: 'a',
		Ć: 'C',
		ć: 'c',
		Ĉ: 'C',
		ĉ: 'c',
		Ċ: 'C',
		ċ: 'c',
		Č: 'C',
		č: 'c',
		C̆: 'C',
		c̆: 'c',
		Ď: 'D',
		ď: 'd',
		Đ: 'D',
		đ: 'd',
		Ē: 'E',
		ē: 'e',
		Ĕ: 'E',
		ĕ: 'e',
		Ė: 'E',
		ė: 'e',
		Ę: 'E',
		ę: 'e',
		Ě: 'E',
		ě: 'e',
		Ĝ: 'G',
		Ǵ: 'G',
		ĝ: 'g',
		ǵ: 'g',
		Ğ: 'G',
		ğ: 'g',
		Ġ: 'G',
		ġ: 'g',
		Ģ: 'G',
		ģ: 'g',
		Ĥ: 'H',
		ĥ: 'h',
		Ħ: 'H',
		ħ: 'h',
		Ḫ: 'H',
		ḫ: 'h',
		Ĩ: 'I',
		ĩ: 'i',
		Ī: 'I',
		ī: 'i',
		Ĭ: 'I',
		ĭ: 'i',
		Į: 'I',
		į: 'i',
		İ: 'I',
		ı: 'i',
		Ĳ: 'IJ',
		ĳ: 'ij',
		Ĵ: 'J',
		ĵ: 'j',
		Ķ: 'K',
		ķ: 'k',
		Ḱ: 'K',
		ḱ: 'k',
		K̆: 'K',
		k̆: 'k',
		Ĺ: 'L',
		ĺ: 'l',
		Ļ: 'L',
		ļ: 'l',
		Ľ: 'L',
		ľ: 'l',
		Ŀ: 'L',
		ŀ: 'l',
		Ł: 'l',
		ł: 'l',
		Ḿ: 'M',
		ḿ: 'm',
		M̆: 'M',
		m̆: 'm',
		Ń: 'N',
		ń: 'n',
		Ņ: 'N',
		ņ: 'n',
		Ň: 'N',
		ň: 'n',
		ŉ: 'n',
		N̆: 'N',
		n̆: 'n',
		Ō: 'O',
		ō: 'o',
		Ŏ: 'O',
		ŏ: 'o',
		Ő: 'O',
		ő: 'o',
		Œ: 'OE',
		œ: 'oe',
		P̆: 'P',
		p̆: 'p',
		Ŕ: 'R',
		ŕ: 'r',
		Ŗ: 'R',
		ŗ: 'r',
		Ř: 'R',
		ř: 'r',
		R̆: 'R',
		r̆: 'r',
		Ȓ: 'R',
		ȓ: 'r',
		Ś: 'S',
		ś: 's',
		Ŝ: 'S',
		ŝ: 's',
		Ş: 'S',
		Ș: 'S',
		ș: 's',
		ş: 's',
		Š: 'S',
		š: 's',
		Ţ: 'T',
		ţ: 't',
		ț: 't',
		Ț: 'T',
		Ť: 'T',
		ť: 't',
		Ŧ: 'T',
		ŧ: 't',
		T̆: 'T',
		t̆: 't',
		Ũ: 'U',
		ũ: 'u',
		Ū: 'U',
		ū: 'u',
		Ŭ: 'U',
		ŭ: 'u',
		Ů: 'U',
		ů: 'u',
		Ű: 'U',
		ű: 'u',
		Ų: 'U',
		ų: 'u',
		Ȗ: 'U',
		ȗ: 'u',
		V̆: 'V',
		v̆: 'v',
		Ŵ: 'W',
		ŵ: 'w',
		Ẃ: 'W',
		ẃ: 'w',
		X̆: 'X',
		x̆: 'x',
		Ŷ: 'Y',
		ŷ: 'y',
		Ÿ: 'Y',
		Y̆: 'Y',
		y̆: 'y',
		Ź: 'Z',
		ź: 'z',
		Ż: 'Z',
		ż: 'z',
		Ž: 'Z',
		ž: 'z',
		ſ: 's',
		ƒ: 'f',
		Ơ: 'O',
		ơ: 'o',
		Ư: 'U',
		ư: 'u',
		Ǎ: 'A',
		ǎ: 'a',
		Ǐ: 'I',
		ǐ: 'i',
		Ǒ: 'O',
		ǒ: 'o',
		Ǔ: 'U',
		ǔ: 'u',
		Ǖ: 'U',
		ǖ: 'u',
		Ǘ: 'U',
		ǘ: 'u',
		Ǚ: 'U',
		ǚ: 'u',
		Ǜ: 'U',
		ǜ: 'u',
		Ứ: 'U',
		ứ: 'u',
		Ṹ: 'U',
		ṹ: 'u',
		Ǻ: 'A',
		ǻ: 'a',
		Ǽ: 'AE',
		ǽ: 'ae',
		Ǿ: 'O',
		ǿ: 'o',
		Þ: 'TH',
		þ: 'th',
		Ṕ: 'P',
		ṕ: 'p',
		Ṥ: 'S',
		ṥ: 's',
		X́: 'X',
		x́: 'x',
		Ѓ: '\u0413',
		ѓ: '\u0433',
		Ќ: '\u041A',
		ќ: '\u043A',
		A̋: 'A',
		a̋: 'a',
		E̋: 'E',
		e̋: 'e',
		I̋: 'I',
		i̋: 'i',
		Ǹ: 'N',
		ǹ: 'n',
		Ồ: 'O',
		ồ: 'o',
		Ṑ: 'O',
		ṑ: 'o',
		Ừ: 'U',
		ừ: 'u',
		Ẁ: 'W',
		ẁ: 'w',
		Ỳ: 'Y',
		ỳ: 'y',
		Ȁ: 'A',
		ȁ: 'a',
		Ȅ: 'E',
		ȅ: 'e',
		Ȉ: 'I',
		ȉ: 'i',
		Ȍ: 'O',
		ȍ: 'o',
		Ȑ: 'R',
		ȑ: 'r',
		Ȕ: 'U',
		ȕ: 'u',
		B̌: 'B',
		b̌: 'b',
		Č̣: 'C',
		č̣: 'c',
		Ê̌: 'E',
		ê̌: 'e',
		F̌: 'F',
		f̌: 'f',
		Ǧ: 'G',
		ǧ: 'g',
		Ȟ: 'H',
		ȟ: 'h',
		J̌: 'J',
		ǰ: 'j',
		Ǩ: 'K',
		ǩ: 'k',
		M̌: 'M',
		m̌: 'm',
		P̌: 'P',
		p̌: 'p',
		Q̌: 'Q',
		q̌: 'q',
		Ř̩: 'R',
		ř̩: 'r',
		Ṧ: 'S',
		ṧ: 's',
		V̌: 'V',
		v̌: 'v',
		W̌: 'W',
		w̌: 'w',
		X̌: 'X',
		x̌: 'x',
		Y̌: 'Y',
		y̌: 'y',
		A̧: 'A',
		a̧: 'a',
		B̧: 'B',
		b̧: 'b',
		Ḑ: 'D',
		ḑ: 'd',
		Ȩ: 'E',
		ȩ: 'e',
		Ɛ̧: 'E',
		ɛ̧: 'e',
		Ḩ: 'H',
		ḩ: 'h',
		I̧: 'I',
		i̧: 'i',
		Ɨ̧: 'I',
		ɨ̧: 'i',
		M̧: 'M',
		m̧: 'm',
		O̧: 'O',
		o̧: 'o',
		Q̧: 'Q',
		q̧: 'q',
		U̧: 'U',
		u̧: 'u',
		X̧: 'X',
		x̧: 'x',
		Z̧: 'Z',
		z̧: 'z'
	},
	ge = Object.keys(ve).join('|'),
	it = new RegExp(ge, 'g'),
	at = new RegExp(ge, ''),
	Ae = function (e) {
		return e.replace(it, function (t) {
			return ve[t];
		});
	},
	ot = function (e) {
		return !!e.match(at);
	};
D.exports = Ae;
D.exports.has = ot;
D.exports.remove = Ae;
var ut = D.exports,
	y = {
		CASE_SENSITIVE_EQUAL: 7,
		EQUAL: 6,
		STARTS_WITH: 5,
		WORD_STARTS_WITH: 4,
		CONTAINS: 3,
		ACRONYM: 2,
		MATCHES: 1,
		NO_MATCH: 0
	};
lt.rankings = y;
var st = function (t, n) {
	return String(t.rankedValue).localeCompare(String(n.rankedValue));
};
function lt(e, t, n) {
	n === void 0 && (n = {});
	var r = n,
		i = r.keys,
		l = r.threshold,
		o = l === void 0 ? y.MATCHES : l,
		u = r.baseSort,
		a = u === void 0 ? st : u,
		s = r.sorter,
		f =
			s === void 0
				? function (_) {
						return _.sort(function (m, h) {
							return ht(m, h, a);
						});
				  }
				: s,
		c = e.reduce(d, []);
	return f(c).map(function (_) {
		var m = _.item;
		return m;
	});
	function d(_, m, h) {
		var p = ct(m, i, t, n),
			v = p.rank,
			A = p.keyThreshold,
			E = A === void 0 ? o : A;
		return v >= E && _.push(L({}, p, { item: m, index: h })), _;
	}
}
function ct(e, t, n, r) {
	if (!t) {
		var i = e;
		return { rankedValue: i, rank: be(i, n, r), keyIndex: -1, keyThreshold: r.threshold };
	}
	var l = pt(e, t);
	return l.reduce(
		function (o, u, a) {
			var s = o.rank,
				f = o.rankedValue,
				c = o.keyIndex,
				d = o.keyThreshold,
				_ = u.itemValue,
				m = u.attributes,
				h = be(_, n, r),
				p = f,
				v = m.minRanking,
				A = m.maxRanking,
				E = m.threshold;
			return (
				h < v && h >= y.MATCHES ? (h = v) : h > A && (h = A),
				h > s && ((s = h), (c = a), (d = E), (p = _)),
				{ rankedValue: p, rank: s, keyIndex: c, keyThreshold: d }
			);
		},
		{ rankedValue: e, rank: y.NO_MATCH, keyIndex: -1, keyThreshold: r.threshold }
	);
}
function be(e, t, n) {
	return (
		(e = Ee(e, n)),
		(t = Ee(t, n)),
		t.length > e.length
			? y.NO_MATCH
			: e === t
			? y.CASE_SENSITIVE_EQUAL
			: ((e = e.toLowerCase()),
			  (t = t.toLowerCase()),
			  e === t
					? y.EQUAL
					: e.startsWith(t)
					? y.STARTS_WITH
					: e.includes(' ' + t)
					? y.WORD_STARTS_WITH
					: e.includes(t)
					? y.CONTAINS
					: t.length === 1
					? y.NO_MATCH
					: ft(e).includes(t)
					? y.ACRONYM
					: dt(e, t))
	);
}
function ft(e) {
	var t = '',
		n = e.split(' ');
	return (
		n.forEach(function (r) {
			var i = r.split('-');
			i.forEach(function (l) {
				t += l.substr(0, 1);
			});
		}),
		t
	);
}
function dt(e, t) {
	var n = 0,
		r = 0;
	function i(d, _, m) {
		for (var h = m, p = _.length; h < p; h++) {
			var v = _[h];
			if (v === d) return (n += 1), h + 1;
		}
		return -1;
	}
	function l(d) {
		var _ = 1 / d,
			m = n / t.length,
			h = y.MATCHES + m * _;
		return h;
	}
	var o = i(t[0], e, 0);
	if (o < 0) return y.NO_MATCH;
	r = o;
	for (var u = 1, a = t.length; u < a; u++) {
		var s = t[u];
		r = i(s, e, r);
		var f = r > -1;
		if (!f) return y.NO_MATCH;
	}
	var c = r - o;
	return l(c);
}
function ht(e, t, n) {
	var r = -1,
		i = 1,
		l = e.rank,
		o = e.keyIndex,
		u = t.rank,
		a = t.keyIndex,
		s = l === u;
	return s ? (o === a ? n(e, t) : o < a ? r : i) : l > u ? r : i;
}
function Ee(e, t) {
	var n = t.keepDiacritics;
	return (e = '' + e), n || (e = ut(e)), e;
}
function _t(e, t) {
	typeof t == 'object' && (t = t.key);
	var n;
	if (typeof t == 'function') n = t(e);
	else if (e == null) n = null;
	else if (Object.hasOwnProperty.call(e, t)) n = e[t];
	else {
		if (t.includes('.')) return mt(t, e);
		n = null;
	}
	return n == null ? [] : Array.isArray(n) ? n : [String(n)];
}
function mt(e, t) {
	for (var n = e.split('.'), r = [t], i = 0, l = n.length; i < l; i++) {
		for (var o = n[i], u = [], a = 0, s = r.length; a < s; a++) {
			var f = r[a];
			if (f != null)
				if (Object.hasOwnProperty.call(f, o)) {
					var c = f[o];
					c != null && u.push(c);
				} else o === '*' && (u = u.concat(f));
		}
		r = u;
	}
	if (Array.isArray(r[0])) {
		var d = [];
		return d.concat.apply(d, r);
	}
	return r;
}
function pt(e, t) {
	for (var n = [], r = 0, i = t.length; r < i; r++)
		for (var l = t[r], o = yt(l), u = _t(e, l), a = 0, s = u.length; a < s; a++)
			n.push({ itemValue: u[a], attributes: o });
	return n;
}
var xe = { maxRanking: 1 / 0, minRanking: -1 / 0 };
function yt(e) {
	return typeof e == 'string' ? xe : L({}, xe, e);
}
export {
	It as A,
	ke as B,
	jt as C,
	Ce as D,
	Ie as E,
	Se as F,
	$e as G,
	De as H,
	g as I,
	$t as J,
	gt as K,
	xt as L,
	x as M,
	At as N,
	vt as O,
	Tt as P,
	lt as Q,
	ce as R,
	et as S,
	zt as T,
	Nt as U,
	I as V,
	Ht as W,
	Vt as X,
	qt as Y,
	We as Z,
	wt as _,
	ae as a,
	kt as b,
	qe as c,
	j as d,
	q as e,
	Pe as f,
	ze as g,
	Ct as h,
	Je as i,
	Pt as j,
	bt as k,
	Et as l,
	Wt as m,
	Ot as n,
	Ke as o,
	Lt as p,
	Dt as q,
	Ut as r,
	Z as s,
	z as t,
	Xe as u,
	Ge as v,
	Rt as w,
	pe as x,
	Mt as y,
	St as z
};
