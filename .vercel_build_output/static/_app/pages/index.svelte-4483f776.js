var je = Object.defineProperty,
	Me = Object.defineProperties;
var Ne = Object.getOwnPropertyDescriptors;
var ge = Object.getOwnPropertySymbols;
var Ue = Object.prototype.hasOwnProperty,
	Fe = Object.prototype.propertyIsEnumerable;
var pe = (n, e, t) =>
		e in n ? je(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : (n[e] = t),
	K = (n, e) => {
		for (var t in e || (e = {})) Ue.call(e, t) && pe(n, t, e[t]);
		if (ge) for (var t of ge(e)) Fe.call(e, t) && pe(n, t, e[t]);
		return n;
	},
	z = (n, e) => Me(n, Ne(e));
import {
	C as qe,
	S as Q,
	i as X,
	s as Y,
	e as S,
	j as M,
	c as L,
	a as A,
	m as H,
	d as b,
	b as k,
	f as R,
	o as N,
	r as G,
	u as I,
	v as U,
	w as J,
	x as y,
	t as ue,
	g as ae,
	H as E,
	h as de,
	k as Z,
	n as x,
	J as ke,
	K as $,
	L as W,
	M as me,
	N as ze,
	l as ee,
	O as _e,
	P as He,
	Q as Ge,
	R as te,
	I as ne,
	A as be,
	T as Je,
	U as Qe,
	V as Xe,
	W as Ye,
	X as Ze,
	Y as we,
	Z as Ce,
	_ as ye
} from '../chunks/vendor-98592d0c.js';
const ve = { search: '', actions: {}, currentRootActionId: null, visible: !1 },
	F = qe(ve),
	T = {
		subscribe: F.subscribe,
		setVisible: (n) => {
			F.update((e) => z(K({}, e), { visible: n }));
		},
		show: () => {
			F.update((n) => z(K({}, n), { visible: !0 }));
		},
		hide: () => {
			F.update((n) => z(K({}, n), { visible: !1 }));
		},
		setCurrentRootAction: (n) => {
			F.update((e) => z(K({}, e), { currentRootActionId: n }));
		},
		setSearch: (n) => {
			F.update((e) => z(K({}, e), { search: n }));
		},
		registerActions: (n) => {
			const e = n.reduce((t, r) => ((t[r.id] = r), t), {});
			return (
				F.update((t) => z(K({}, t), { actions: K(K({}, e), t.actions) })),
				function () {
					F.update((r) => {
						const l = r.actions;
						return (
							Object.keys(e).forEach((i) => delete l[i]),
							z(K({}, r), { actions: K(K({}, r.actions), l) })
						);
					});
				}
			);
		},
		reset: () => {
			F.set(K({}, ve));
		}
	};
function Ie(n) {
	let e, t, r;
	var l = n[0].icon;
	function s(i) {
		return {};
	}
	return (
		l && (t = new l(s())),
		{
			c() {
				(e = S('div')), t && M(t.$$.fragment), this.h();
			},
			l(i) {
				e = L(i, 'DIV', { class: !0 });
				var o = A(e);
				t && H(t.$$.fragment, o), o.forEach(b), this.h();
			},
			h() {
				k(e, 'class', 'result-wrapper__icon svelte-1dddn8x');
			},
			m(i, o) {
				R(i, e, o), t && N(t, e, null), (r = !0);
			},
			p(i, o) {
				if (l !== (l = i[0].icon)) {
					if (t) {
						G();
						const u = t;
						I(u.$$.fragment, 1, 0, () => {
							U(u, 1);
						}),
							J();
					}
					l ? ((t = new l(s())), M(t.$$.fragment), y(t.$$.fragment, 1), N(t, e, null)) : (t = null);
				}
			},
			i(i) {
				r || (t && y(t.$$.fragment, i), (r = !0));
			},
			o(i) {
				t && I(t.$$.fragment, i), (r = !1);
			},
			d(i) {
				i && b(e), t && U(t);
			}
		}
	);
}
function Ee(n) {
	let e,
		t = n[0].subtitle + '',
		r;
	return {
		c() {
			(e = S('div')), (r = ue(t));
		},
		l(l) {
			e = L(l, 'DIV', {});
			var s = A(e);
			(r = ae(s, t)), s.forEach(b);
		},
		m(l, s) {
			R(l, e, s), E(e, r);
		},
		p(l, s) {
			s & 1 && t !== (t = l[0].subtitle + '') && de(r, t);
		},
		d(l) {
			l && b(e);
		}
	};
}
function De(n) {
	let e,
		t = n[0].shortcut + '',
		r;
	return {
		c() {
			(e = S('kbd')), (r = ue(t)), this.h();
		},
		l(l) {
			e = L(l, 'KBD', { class: !0 });
			var s = A(e);
			(r = ae(s, t)), s.forEach(b), this.h();
		},
		h() {
			k(e, 'class', 'result-wrapper__shortcut svelte-1dddn8x');
		},
		m(l, s) {
			R(l, e, s), E(e, r);
		},
		p(l, s) {
			s & 1 && t !== (t = l[0].shortcut + '') && de(r, t);
		},
		d(l) {
			l && b(e);
		}
	};
}
function xe(n) {
	let e,
		t,
		r,
		l,
		s = n[0].name + '',
		i,
		o,
		u,
		c,
		_ = n[0].icon && Ie(n),
		w = n[0].subtitle && Ee(n),
		f = n[0].shortcut && De(n);
	return {
		c() {
			(e = S('div')),
				_ && _.c(),
				(t = Z()),
				(r = S('div')),
				(l = S('span')),
				(i = ue(s)),
				(o = Z()),
				w && w.c(),
				(u = Z()),
				f && f.c(),
				this.h();
		},
		l(m) {
			e = L(m, 'DIV', { class: !0 });
			var g = A(e);
			_ && _.l(g), (t = x(g)), (r = L(g, 'DIV', { class: !0 }));
			var d = A(r);
			l = L(d, 'SPAN', { class: !0 });
			var p = A(l);
			(i = ae(p, s)),
				p.forEach(b),
				(o = x(d)),
				w && w.l(d),
				d.forEach(b),
				(u = x(g)),
				f && f.l(g),
				g.forEach(b),
				this.h();
		},
		h() {
			k(l, 'class', 'result-wrapper__name svelte-1dddn8x'),
				k(r, 'class', 'result-wrapper__titles svelte-1dddn8x'),
				k(e, 'class', 'result-wrapper svelte-1dddn8x'),
				ke(e, 'active', n[1]);
		},
		m(m, g) {
			R(m, e, g),
				_ && _.m(e, null),
				E(e, t),
				E(e, r),
				E(r, l),
				E(l, i),
				E(r, o),
				w && w.m(r, null),
				E(e, u),
				f && f.m(e, null),
				(c = !0);
		},
		p(m, [g]) {
			m[0].icon
				? _
					? (_.p(m, g), g & 1 && y(_, 1))
					: ((_ = Ie(m)), _.c(), y(_, 1), _.m(e, t))
				: _ &&
				  (G(),
				  I(_, 1, 1, () => {
						_ = null;
				  }),
				  J()),
				(!c || g & 1) && s !== (s = m[0].name + '') && de(i, s),
				m[0].subtitle
					? w
						? w.p(m, g)
						: ((w = Ee(m)), w.c(), w.m(r, null))
					: w && (w.d(1), (w = null)),
				m[0].shortcut
					? f
						? f.p(m, g)
						: ((f = De(m)), f.c(), f.m(e, null))
					: f && (f.d(1), (f = null)),
				g & 2 && ke(e, 'active', m[1]);
		},
		i(m) {
			c || (y(_), (c = !0));
		},
		o(m) {
			I(_), (c = !1);
		},
		d(m) {
			m && b(e), _ && _.d(), w && w.d(), f && f.d();
		}
	};
}
function $e(n, e, t) {
	let { result: r } = e,
		{ active: l } = e;
	return (
		(n.$$set = (s) => {
			'result' in s && t(0, (r = s.result)), 'active' in s && t(1, (l = s.active));
		}),
		[r, l]
	);
}
class et extends Q {
	constructor(e) {
		super();
		X(this, e, $e, xe, Y, { result: 0, active: 1 });
	}
}
function Ae(n, e, t) {
	const r = n.slice();
	return (r[35] = e[t]), (r[36] = e), (r[37] = t), r;
}
function Be(n) {
	let e,
		t,
		r,
		l = n[7],
		s = [];
	for (let o = 0; o < l.length; o += 1) s[o] = Se(Ae(n, l, o));
	const i = (o) =>
		I(s[o], 1, 1, () => {
			s[o] = null;
		});
	return {
		c() {
			e = S('ul');
			for (let o = 0; o < s.length; o += 1) s[o].c();
			this.h();
		},
		l(o) {
			e = L(o, 'UL', { class: !0, role: !0 });
			var u = A(e);
			for (let c = 0; c < s.length; c += 1) s[c].l(u);
			u.forEach(b), this.h();
		},
		h() {
			k(e, 'class', (t = '' + ($(n[0] || '') + ' svelte-1ph4m4y'))), k(e, 'role', 'menu');
		},
		m(o, u) {
			R(o, e, u);
			for (let c = 0; c < s.length; c += 1) s[c].m(e, null);
			n[28](e), (r = !0);
		},
		p(o, u) {
			if (u[0] & 1470) {
				l = o[7];
				let c;
				for (c = 0; c < l.length; c += 1) {
					const _ = Ae(o, l, c);
					s[c]
						? (s[c].p(_, u), y(s[c], 1))
						: ((s[c] = Se(_)), s[c].c(), y(s[c], 1), s[c].m(e, null));
				}
				for (G(), c = l.length; c < s.length; c += 1) i(c);
				J();
			}
			(!r || (u[0] & 1 && t !== (t = '' + ($(o[0] || '') + ' svelte-1ph4m4y')))) &&
				k(e, 'class', t);
		},
		i(o) {
			if (!r) {
				for (let u = 0; u < l.length; u += 1) y(s[u]);
				r = !0;
			}
		},
		o(o) {
			s = s.filter(Boolean);
			for (let u = 0; u < s.length; u += 1) I(s[u]);
			r = !1;
		},
		d(o) {
			o && b(e), ze(s, o), n[28](null);
		}
	};
}
function tt(n) {
	let e, t;
	return (
		(e = new et({ props: { result: n[35], active: n[3] === n[37] } })),
		{
			c() {
				M(e.$$.fragment);
			},
			l(r) {
				H(e.$$.fragment, r);
			},
			m(r, l) {
				N(e, r, l), (t = !0);
			},
			p(r, l) {
				const s = {};
				l[0] & 128 && (s.result = r[35]), l[0] & 8 && (s.active = r[3] === r[37]), e.$set(s);
			},
			i(r) {
				t || (y(e.$$.fragment, r), (t = !0));
			},
			o(r) {
				I(e.$$.fragment, r), (t = !1);
			},
			d(r) {
				U(e, r);
			}
		}
	);
}
function nt(n) {
	let e, t, r;
	var l = n[2];
	function s(i) {
		return { props: { result: i[35], active: i[3] === i[37] } };
	}
	return (
		l && (e = new l(s(n))),
		{
			c() {
				e && M(e.$$.fragment), (t = ee());
			},
			l(i) {
				e && H(e.$$.fragment, i), (t = ee());
			},
			m(i, o) {
				e && N(e, i, o), R(i, t, o), (r = !0);
			},
			p(i, o) {
				const u = {};
				if (
					(o[0] & 128 && (u.result = i[35]),
					o[0] & 8 && (u.active = i[3] === i[37]),
					l !== (l = i[2]))
				) {
					if (e) {
						G();
						const c = e;
						I(c.$$.fragment, 1, 0, () => {
							U(c, 1);
						}),
							J();
					}
					l
						? ((e = new l(s(i))), M(e.$$.fragment), y(e.$$.fragment, 1), N(e, t.parentNode, t))
						: (e = null);
				} else l && e.$set(u);
			},
			i(i) {
				r || (e && y(e.$$.fragment, i), (r = !0));
			},
			o(i) {
				e && I(e.$$.fragment, i), (r = !1);
			},
			d(i) {
				i && b(t), e && U(e, i);
			}
		}
	);
}
function Se(n) {
	let e,
		t,
		r,
		l,
		s,
		i = n[37],
		o,
		u,
		c,
		_;
	const w = [nt, tt],
		f = [];
	function m(v, C) {
		return v[2] ? 0 : 1;
	}
	(r = m(n)), (l = f[r] = w[r](n));
	const g = () => n[23](t, i),
		d = () => n[23](null, i);
	function p(...v) {
		return n[24](n[37], ...v);
	}
	function O() {
		return n[25](n[37]);
	}
	function P() {
		return n[26](n[37]);
	}
	function D() {
		return n[27](n[37]);
	}
	return {
		c() {
			(e = S('li')), (t = S('button')), l.c(), (o = Z()), this.h();
		},
		l(v) {
			e = L(v, 'LI', { role: !0 });
			var C = A(e);
			t = L(C, 'BUTTON', { class: !0, role: !0 });
			var V = A(t);
			l.l(V), V.forEach(b), (o = x(C)), C.forEach(b), this.h();
		},
		h() {
			k(t, 'class', (s = '' + ($(n[1] || '') + ' svelte-1ph4m4y'))),
				k(t, 'role', 'menuitem'),
				k(e, 'role', 'none');
		},
		m(v, C) {
			R(v, e, C),
				E(e, t),
				f[r].m(t, null),
				g(),
				E(e, o),
				(u = !0),
				c ||
					((_ = [
						W(t, 'click', p),
						W(t, 'focus', O),
						W(t, 'blur', n[10]),
						W(t, 'mouseenter', P),
						W(t, 'pointerdown', D)
					]),
					(c = !0));
		},
		p(v, C) {
			n = v;
			let V = r;
			(r = m(n)),
				r === V
					? f[r].p(n, C)
					: (G(),
					  I(f[V], 1, 1, () => {
							f[V] = null;
					  }),
					  J(),
					  (l = f[r]),
					  l ? l.p(n, C) : ((l = f[r] = w[r](n)), l.c()),
					  y(l, 1),
					  l.m(t, null)),
				(!u || (C[0] & 2 && s !== (s = '' + ($(n[1] || '') + ' svelte-1ph4m4y')))) &&
					k(t, 'class', s),
				i !== n[37] && (d(), (i = n[37]), g());
		},
		i(v) {
			u || (y(l), (u = !0));
		},
		o(v) {
			I(l), (u = !1);
		},
		d(v) {
			v && b(e), f[r].d(), d(), (c = !1), me(_);
		}
	};
}
function st(n) {
	let e,
		t,
		r,
		l,
		s = n[7].length && Be(n);
	return {
		c() {
			s && s.c(), (e = ee());
		},
		l(i) {
			s && s.l(i), (e = ee());
		},
		m(i, o) {
			s && s.m(i, o), R(i, e, o), (t = !0), r || ((l = W(window, 'keydown', n[9])), (r = !0));
		},
		p(i, o) {
			i[7].length
				? s
					? (s.p(i, o), o[0] & 128 && y(s, 1))
					: ((s = Be(i)), s.c(), y(s, 1), s.m(e.parentNode, e))
				: s &&
				  (G(),
				  I(s, 1, 1, () => {
						s = null;
				  }),
				  J());
		},
		i(i) {
			t || (y(s), (t = !0));
		},
		o(i) {
			I(s), (t = !1);
		},
		d(i) {
			s && s.d(i), i && b(e), (r = !1), l();
		}
	};
}
function rt(n, e, t) {
	let r, l, s, i, o, u, c;
	_e(n, T, (a) => t(22, (c = a)));
	var _;
	const w = He();
	let { searchComponent: f } = e,
		{ customListClass: m = null } = e,
		{ customButtonClass: g = null } = e,
		{ wrapper: d = null } = e,
		p = 0,
		O,
		P = [],
		D = !1,
		v = !1,
		C = [];
	function V() {
		C.length && P.length && ((v = !0), t(5, (D = !0)), t(3, (p = 0)));
	}
	function ce() {
		C.length && P.length && ((v = !0), t(5, (D = !0)), t(3, (p = C.length - 1)));
	}
	function fe() {
		t(3, (p = 0)), re();
	}
	function se() {
		t(3, (p = 0));
	}
	function ie(a, B) {
		a.stopPropagation(), t(3, (p = B)), re();
	}
	function re() {
		if (p < 0) return;
		const a = C[p];
		!a || (a.perform ? (a.perform(), w('hide')) : (T.setCurrentRootAction(a.id), T.setSearch('')));
	}
	function oe() {
		p >= C.length - 1 ? t(3, (p = 0)) : t(3, (p = p + 1));
	}
	function he() {
		p === 0 ? t(3, (p = C.length - 1)) : t(3, (p = p - 1));
	}
	function h(a) {
		if (!!D) {
			if (v) {
				v = !1;
				return;
			}
			a.preventDefault(),
				a.stopPropagation(),
				(a.key === 'ArrowDown' || (a.ctrlKey && a.key === 'n')) && oe(),
				(a.key === 'ArrowUp' || (a.ctrlKey && a.key === 'p')) && he(),
				a.key === 'Enter' && (f.focus(), re()),
				a.key === 'Home' && t(3, (p = 0)),
				a.key === 'End' && t(3, (p = C.length - 1)),
				a.key === 'Tab' && !a.shiftKey && oe(),
				a.key === 'Tab' && a.shiftKey && (t(3, (p = 0)), f.focus());
		}
	}
	function Pe() {
		(O == null ? void 0 : O.contains(document.activeElement)) || t(5, (D = !1));
	}
	function Ke(a, B) {
		te[a ? 'unshift' : 'push'](() => {
			(P[B] = a), t(4, P);
		});
	}
	const Re = (a, B) => {
			ie(B, a);
		},
		Oe = (a) => {
			t(5, (D = !0)), t(3, (p = a));
		},
		Te = (a) => {
			t(3, (p = a));
		},
		Ve = (a) => {
			t(3, (p = a));
		};
	function We(a) {
		te[a ? 'unshift' : 'push'](() => {
			(O = a), t(6, O);
		});
	}
	return (
		(n.$$set = (a) => {
			'searchComponent' in a && t(11, (f = a.searchComponent)),
				'customListClass' in a && t(0, (m = a.customListClass)),
				'customButtonClass' in a && t(1, (g = a.customButtonClass)),
				'wrapper' in a && t(2, (d = a.wrapper));
		}),
		(n.$$.update = () => {
			if (
				(n.$$.dirty[0] & 4194304 &&
					t(
						16,
						({ search: r, currentRootActionId: l, actions: s } = c),
						r,
						(t(18, l), t(22, c)),
						(t(20, s), t(22, c))
					),
				n.$$.dirty[0] & 32824 &&
					D &&
					P.length &&
					P.length > p &&
					(t(15, (_ = P[p])) === null || _ === void 0 || _.focus()),
				n.$$.dirty[0] & 1048576 && t(21, (i = Object.keys(s).map((a) => s[a]))),
				n.$$.dirty[0] & 3407872 &&
					t(
						19,
						(o = (function () {
							if (!l) return i.reduce((j, q) => (q.parent || (j[q.id] = q), j), {});
							const a = s[l],
								B = a.children;
							return B
								? K(
										{},
										B.reduce((j, q) => ((j[q] = s[q]), j), {})
								  )
								: { [a.id]: a };
						})())
					),
				n.$$.dirty[0] & 524288 && t(17, (u = Object.keys(o).map((a) => o[a]))),
				n.$$.dirty[0] & 196608)
			) {
				const a = r.trim();
				if (a === '') t(7, (C = u));
				else {
					let B = Ge(u, r, { keys: ['keywords', 'name'] });
					if (a.length === 1) {
						const j = u.filter((le) => le.shortcut.includes(a)),
							q = j.map((le) => le.id);
						j.length && ((B = B.filter((le) => !q.includes(le.id))), (B = [...j, ...B]));
					}
					t(7, (C = B));
				}
			}
			n.$$.dirty[0] & 458752 && (u.length, se());
		}),
		[
			m,
			g,
			d,
			p,
			P,
			D,
			O,
			C,
			ie,
			h,
			Pe,
			f,
			V,
			ce,
			fe,
			_,
			r,
			u,
			l,
			o,
			s,
			i,
			c,
			Ke,
			Re,
			Oe,
			Te,
			Ve,
			We
		]
	);
}
class lt extends Q {
	constructor(e) {
		super();
		X(
			this,
			e,
			rt,
			st,
			Y,
			{
				searchComponent: 11,
				customListClass: 0,
				customButtonClass: 1,
				wrapper: 2,
				focus: 12,
				focusEnd: 13,
				selectFirst: 14
			},
			null,
			[-1, -1]
		);
	}
	get focus() {
		return this.$$.ctx[12];
	}
	get focusEnd() {
		return this.$$.ctx[13];
	}
	get selectFirst() {
		return this.$$.ctx[14];
	}
}
function it(n) {
	let e, t, r, l;
	return {
		c() {
			(e = S('input')), this.h();
		},
		l(s) {
			(e = L(s, 'INPUT', { class: !0, placeholder: !0 })), this.h();
		},
		h() {
			k(e, 'class', (t = n[0] || '')), (e.value = n[3]), k(e, 'placeholder', n[1]);
		},
		m(s, i) {
			R(s, e, i), n[9](e), r || ((l = [W(e, 'input', n[4]), W(e, 'keydown', n[5])]), (r = !0));
		},
		p(s, [i]) {
			i & 1 && t !== (t = s[0] || '') && k(e, 'class', t),
				i & 8 && e.value !== s[3] && (e.value = s[3]),
				i & 2 && k(e, 'placeholder', s[1]);
		},
		i: ne,
		o: ne,
		d(s) {
			s && b(e), n[9](null), (r = !1), me(l);
		}
	};
}
function ot(n, e, t) {
	let r, l, s, i;
	_e(n, T, (d) => t(8, (i = d)));
	let { resultsComponent: o } = e,
		{ customClass: u = null } = e,
		{ placeholder: c = 'Type a command or search...' } = e,
		_;
	be(() => {
		_.focus();
	});
	function w() {
		_.focus();
	}
	function f(d) {
		T.setSearch(d.target.value);
	}
	function m(d) {
		if (l && !r && d.key === 'Backspace') {
			const p = s[l].parent;
			T.setCurrentRootAction(p);
		}
		d.key === 'ArrowDown' && (d.preventDefault(), o.focus()),
			d.key === 'Enter' && (d.preventDefault(), o.selectFirst()),
			d.key === 'ArrowUp' && (d.preventDefault(), o.focusEnd()),
			d.key === 'Tab' && d.shiftKey && (d.preventDefault(), o.focusEnd()),
			d.key === 'Tab' && !d.shiftKey && (d.preventDefault(), o.focus());
	}
	function g(d) {
		te[d ? 'unshift' : 'push'](() => {
			(_ = d), t(2, _);
		});
	}
	return (
		(n.$$set = (d) => {
			'resultsComponent' in d && t(6, (o = d.resultsComponent)),
				'customClass' in d && t(0, (u = d.customClass)),
				'placeholder' in d && t(1, (c = d.placeholder));
		}),
		(n.$$.update = () => {
			n.$$.dirty & 256 && t(3, ({ search: r, currentRootActionId: l, actions: s } = i), r);
		}),
		[u, c, _, r, f, m, o, w, i, g]
	);
}
class ut extends Q {
	constructor(e) {
		super();
		X(this, e, ot, it, Y, { resultsComponent: 6, customClass: 0, placeholder: 1, focus: 7 });
	}
	get focus() {
		return this.$$.ctx[7];
	}
}
function Le(n) {
	let e,
		t,
		r,
		l,
		s,
		i,
		o,
		u,
		c,
		_ = { customClass: n[2], resultsComponent: n[12], placeholder: n[3] };
	(r = new ut({ props: _ })), n[21](r);
	let w = { wrapper: n[6], customListClass: n[4], customButtonClass: n[5], searchComponent: n[13] };
	return (
		(s = new lt({ props: w })),
		n[22](s),
		s.$on('hide', n[23]),
		{
			c() {
				(e = S('div')), (t = S('div')), M(r.$$.fragment), (l = Z()), M(s.$$.fragment), this.h();
			},
			l(f) {
				e = L(f, 'DIV', { class: !0, style: !0 });
				var m = A(e);
				t = L(m, 'DIV', { role: !0, class: !0 });
				var g = A(t);
				H(r.$$.fragment, g), (l = x(g)), H(s.$$.fragment, g), g.forEach(b), m.forEach(b), this.h();
			},
			h() {
				k(t, 'role', 'dialog'),
					k(t, 'class', (i = '' + ($(n[1] || '') + ' svelte-a16tqz'))),
					k(e, 'class', 'kbar__position-container svelte-a16tqz'),
					k(e, 'style', n[0]);
			},
			m(f, m) {
				R(f, e, m), E(e, t), N(r, t, null), E(t, l), N(s, t, null), n[24](t), (c = !0);
			},
			p(f, m) {
				n = f;
				const g = {};
				m & 4 && (g.customClass = n[2]),
					m & 4096 && (g.resultsComponent = n[12]),
					m & 8 && (g.placeholder = n[3]),
					r.$set(g);
				const d = {};
				m & 64 && (d.wrapper = n[6]),
					m & 16 && (d.customListClass = n[4]),
					m & 32 && (d.customButtonClass = n[5]),
					m & 8192 && (d.searchComponent = n[13]),
					s.$set(d),
					(!c || (m & 2 && i !== (i = '' + ($(n[1] || '') + ' svelte-a16tqz')))) &&
						k(t, 'class', i),
					(!c || m & 1) && k(e, 'style', n[0]);
			},
			i(f) {
				c ||
					(y(r.$$.fragment, f),
					y(s.$$.fragment, f),
					Xe(() => {
						u && u.end(1), (o = Ye(t, n[7], n[8])), o.start();
					}),
					(c = !0));
			},
			o(f) {
				I(r.$$.fragment, f),
					I(s.$$.fragment, f),
					o && o.invalidate(),
					(u = Ze(t, n[9], n[10])),
					(c = !1);
			},
			d(f) {
				f && b(e), n[21](null), U(r), n[22](null), U(s), n[24](null), f && u && u.end();
			}
		}
	);
}
function at(n) {
	let e,
		t,
		r = n[15] && Le(n);
	return {
		c() {
			r && r.c(), (e = ee());
		},
		l(l) {
			r && r.l(l), (e = ee());
		},
		m(l, s) {
			r && r.m(l, s), R(l, e, s), (t = !0);
		},
		p(l, s) {
			l[15]
				? r
					? (r.p(l, s), s & 32768 && y(r, 1))
					: ((r = Le(l)), r.c(), y(r, 1), r.m(e.parentNode, e))
				: r &&
				  (G(),
				  I(r, 1, 1, () => {
						r = null;
				  }),
				  J());
		},
		i(l) {
			t || (y(r), (t = !0));
		},
		o(l) {
			I(r), (t = !1);
		},
		d(l) {
			r && r.d(l), l && b(e);
		}
	};
}
function ct(n) {
	let e, t, r, l;
	return (
		(e = new Je({ props: { target: 'body', $$slots: { default: [at] }, $$scope: { ctx: n } } })),
		{
			c() {
				M(e.$$.fragment);
			},
			l(s) {
				H(e.$$.fragment, s);
			},
			m(s, i) {
				N(e, s, i),
					(t = !0),
					r || ((l = [W(window, 'keydown', n[16]), W(window, 'click', n[17])]), (r = !0));
			},
			p(s, [i]) {
				const o = {};
				i & 134280319 && (o.$$scope = { dirty: i, ctx: s }), e.$set(o);
			},
			i(s) {
				t || (y(e.$$.fragment, s), (t = !0));
			},
			o(s) {
				I(e.$$.fragment, s), (t = !1);
			},
			d(s) {
				U(e, s), (r = !1), me(l);
			}
		}
	);
}
function ft(n, e, t) {
	let r, l;
	_e(n, T, (h) => t(20, (l = h)));
	let { positionContainerStyles: s = '' } = e,
		{ actions: i = [] } = e,
		{ dialogClass: o = null } = e,
		{ searchClass: u = null } = e,
		{ searchPlaceholder: c = 'Type a command or search...' } = e,
		{ resultListClass: _ = null } = e,
		{ resultItemClass: w = null } = e,
		{ resultWrapper: f = null } = e,
		{ transitionIn: m = we } = e,
		{ transitionInParams: g = { duration: 200 } } = e,
		{ transitionOut: d = we } = e,
		{ transitionOutParams: p = { duration: 200 } } = e,
		O,
		P,
		D,
		v;
	function C(h = !1) {
		T.hide(), h && v.focus();
	}
	function V() {
		T.setSearch(''), T.setCurrentRootAction(null), T.show(), (v = document.activeElement);
	}
	function ce(h) {
		h.ctrlKey && h.key === 'k' && (h.preventDefault(), r ? C(!0) : V()),
			h.key === 'Escape' && r && (h.preventDefault(), C(!0));
	}
	function fe(h) {
		r && D && !D.contains(h.target) && D !== h.target ? C() : h.stopPropagation();
	}
	let se;
	be(() => {
		se = T.registerActions(i);
	}),
		Qe(() => {
			se && se();
		});
	function ie(h) {
		te[h ? 'unshift' : 'push'](() => {
			(P = h), t(13, P);
		});
	}
	function re(h) {
		te[h ? 'unshift' : 'push'](() => {
			(O = h), t(12, O);
		});
	}
	const oe = () => {
		C(!0);
	};
	function he(h) {
		te[h ? 'unshift' : 'push'](() => {
			(D = h), t(14, D);
		});
	}
	return (
		(n.$$set = (h) => {
			'positionContainerStyles' in h && t(0, (s = h.positionContainerStyles)),
				'actions' in h && t(18, (i = h.actions)),
				'dialogClass' in h && t(1, (o = h.dialogClass)),
				'searchClass' in h && t(2, (u = h.searchClass)),
				'searchPlaceholder' in h && t(3, (c = h.searchPlaceholder)),
				'resultListClass' in h && t(4, (_ = h.resultListClass)),
				'resultItemClass' in h && t(5, (w = h.resultItemClass)),
				'resultWrapper' in h && t(6, (f = h.resultWrapper)),
				'transitionIn' in h && t(7, (m = h.transitionIn)),
				'transitionInParams' in h && t(8, (g = h.transitionInParams)),
				'transitionOut' in h && t(9, (d = h.transitionOut)),
				'transitionOutParams' in h && t(10, (p = h.transitionOutParams));
		}),
		(n.$$.update = () => {
			n.$$.dirty & 1048576 && t(15, ({ visible: r } = l), r);
		}),
		[s, o, u, c, _, w, f, m, g, d, p, C, O, P, D, r, ce, fe, i, V, l, ie, re, oe, he]
	);
}
class ht extends Q {
	constructor(e) {
		super();
		X(this, e, ft, ct, Y, {
			positionContainerStyles: 0,
			actions: 18,
			dialogClass: 1,
			searchClass: 2,
			searchPlaceholder: 3,
			resultListClass: 4,
			resultItemClass: 5,
			resultWrapper: 6,
			transitionIn: 7,
			transitionInParams: 8,
			transitionOut: 9,
			transitionOutParams: 10,
			hide: 11,
			show: 19
		});
	}
	get hide() {
		return this.$$.ctx[11];
	}
	get show() {
		return this.$$.ctx[19];
	}
}
function dt(n) {
	let e, t, r;
	return {
		c() {
			(e = S('div')), (t = Ce('svg')), (r = Ce('path')), this.h();
		},
		l(l) {
			e = L(l, 'DIV', {});
			var s = A(e);
			t = ye(s, 'svg', { xmlns: !0, class: !0, fill: !0, viewBox: !0, stroke: !0 });
			var i = A(t);
			(r = ye(i, 'path', {
				'stroke-linecap': !0,
				'stroke-linejoin': !0,
				'stroke-width': !0,
				d: !0
			})),
				A(r).forEach(b),
				i.forEach(b),
				s.forEach(b),
				this.h();
		},
		h() {
			k(r, 'stroke-linecap', 'round'),
				k(r, 'stroke-linejoin', 'round'),
				k(r, 'stroke-width', '2'),
				k(
					r,
					'd',
					'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
				),
				k(t, 'xmlns', 'http://www.w3.org/2000/svg'),
				k(t, 'class', 'h-6 w-6'),
				k(t, 'fill', 'none'),
				k(t, 'viewBox', '0 0 24 24'),
				k(t, 'stroke', 'currentColor');
		},
		m(l, s) {
			R(l, e, s), E(e, t), E(t, r);
		},
		p: ne,
		i: ne,
		o: ne,
		d(l) {
			l && b(e);
		}
	};
}
class mt extends Q {
	constructor(e) {
		super();
		X(this, e, null, dt, Y, {});
	}
}
function _t(n) {
	let e, t, r, l, s, i;
	return (
		(s = new ht({ props: { searchClass: 'mySearch', dialogClass: 'myDialog', actions: n[0] } })),
		{
			c() {
				(e = S('div')),
					(t = S('a')),
					(r = ue('Link to test focus')),
					(l = Z()),
					M(s.$$.fragment),
					this.h();
			},
			l(o) {
				e = L(o, 'DIV', {});
				var u = A(e);
				t = L(u, 'A', { href: !0 });
				var c = A(t);
				(r = ae(c, 'Link to test focus')),
					c.forEach(b),
					(l = x(u)),
					H(s.$$.fragment, u),
					u.forEach(b),
					this.h();
			},
			h() {
				k(t, 'href', '#test');
			},
			m(o, u) {
				R(o, e, u), E(e, t), E(t, r), E(e, l), N(s, e, null), (i = !0);
			},
			p: ne,
			i(o) {
				i || (y(s.$$.fragment, o), (i = !0));
			},
			o(o) {
				I(s.$$.fragment, o), (i = !1);
			},
			d(o) {
				o && b(e), U(s);
			}
		}
	);
}
function gt(n) {
	return [
		[
			{
				id: 'blog',
				name: 'Blog',
				shortcut: ['b'],
				keywords: 'writing words',
				icon: mt,
				subtitle: 'Go to the blog!',
				perform: () => (window.location.pathname = 'blog')
			},
			{
				id: 'contact',
				name: 'Contact',
				shortcut: ['c'],
				keywords: 'email',
				perform: () => (window.location.pathname = 'contact')
			},
			{
				id: 'theme',
				name: 'Set Theme',
				shortcut: ['t'],
				keywords: 'dark light mode',
				children: ['dark', 'light']
			},
			{
				id: 'dark',
				name: 'Dark Mode',
				parent: 'theme',
				shortcut: ['d'],
				keywords: '',
				perform: () => {
					console.log('Dark mode');
				}
			},
			{
				id: 'light',
				name: 'Light Mode',
				parent: 'theme',
				shortcut: ['l'],
				keywords: '',
				perform: () => {
					console.log('Light mode');
				}
			}
		]
	];
}
class bt extends Q {
	constructor(e) {
		super();
		X(this, e, gt, _t, Y, {});
	}
}
export { bt as default };
