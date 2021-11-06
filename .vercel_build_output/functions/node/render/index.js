var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, '__esModule', { value: true });
var __esm = (fn, res) =>
	function __init() {
		return fn && (res = (0, fn[Object.keys(fn)[0]])((fn = 0))), res;
	};
var __commonJS = (cb, mod) =>
	function __require() {
		return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
	};
var __export = (target, all) => {
	__markAsModule(target);
	for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
	if ((module2 && typeof module2 === 'object') || typeof module2 === 'function') {
		for (let key of __getOwnPropNames(module2))
			if (!__hasOwnProp.call(target, key) && key !== 'default')
				__defProp(target, key, {
					get: () => module2[key],
					enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable
				});
	}
	return target;
};
var __toModule = (module2) => {
	return __reExport(
		__markAsModule(
			__defProp(
				module2 != null ? __create(__getProtoOf(module2)) : {},
				'default',
				module2 && module2.__esModule && 'default' in module2
					? { get: () => module2.default, enumerable: true }
					: { value: module2, enumerable: true }
			)
		),
		module2
	);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
	if (!/^data:/i.test(uri)) {
		throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
	}
	uri = uri.replace(/\r?\n/g, '');
	const firstComma = uri.indexOf(',');
	if (firstComma === -1 || firstComma <= 4) {
		throw new TypeError('malformed data: URI');
	}
	const meta = uri.substring(5, firstComma).split(';');
	let charset = '';
	let base64 = false;
	const type = meta[0] || 'text/plain';
	let typeFull = type;
	for (let i = 1; i < meta.length; i++) {
		if (meta[i] === 'base64') {
			base64 = true;
		} else {
			typeFull += `;${meta[i]}`;
			if (meta[i].indexOf('charset=') === 0) {
				charset = meta[i].substring(8);
			}
		}
	}
	if (!meta[0] && !charset.length) {
		typeFull += ';charset=US-ASCII';
		charset = 'US-ASCII';
	}
	const encoding = base64 ? 'base64' : 'ascii';
	const data = unescape(uri.substring(firstComma + 1));
	const buffer = Buffer.from(data, encoding);
	buffer.type = type;
	buffer.typeFull = typeFull;
	buffer.charset = charset;
	return buffer;
}
async function* toIterator(parts, clone2 = true) {
	for (let part of parts) {
		if ('stream' in part) {
			yield* part.stream();
		} else if (ArrayBuffer.isView(part)) {
			if (clone2) {
				let position = part.byteOffset;
				let end = part.byteOffset + part.byteLength;
				while (position !== end) {
					const size = Math.min(end - position, POOL_SIZE);
					const chunk = part.buffer.slice(position, position + size);
					position += chunk.byteLength;
					yield new Uint8Array(chunk);
				}
			} else {
				yield part;
			}
		} else {
			let position = 0;
			while (position !== part.size) {
				const chunk = part.slice(position, Math.min(part.size, position + POOL_SIZE));
				const buffer = await chunk.arrayBuffer();
				position += buffer.byteLength;
				yield new Uint8Array(buffer);
			}
		}
	}
}
function isFormData(object) {
	return (
		typeof object === 'object' &&
		typeof object.append === 'function' &&
		typeof object.set === 'function' &&
		typeof object.get === 'function' &&
		typeof object.getAll === 'function' &&
		typeof object.delete === 'function' &&
		typeof object.keys === 'function' &&
		typeof object.values === 'function' &&
		typeof object.entries === 'function' &&
		typeof object.constructor === 'function' &&
		object[NAME] === 'FormData'
	);
}
function getHeader(boundary, name, field) {
	let header = '';
	header += `${dashes}${boundary}${carriage}`;
	header += `Content-Disposition: form-data; name="${name}"`;
	if (isBlob(field)) {
		header += `; filename="${field.name}"${carriage}`;
		header += `Content-Type: ${field.type || 'application/octet-stream'}`;
	}
	return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
	for (const [name, value] of form) {
		yield getHeader(boundary, name, value);
		if (isBlob(value)) {
			yield* value.stream();
		} else {
			yield value;
		}
		yield carriage;
	}
	yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
	let length = 0;
	for (const [name, value] of form) {
		length += Buffer.byteLength(getHeader(boundary, name, value));
		length += isBlob(value) ? value.size : Buffer.byteLength(String(value));
		length += carriageLength;
	}
	length += Buffer.byteLength(getFooter(boundary));
	return length;
}
async function consumeBody(data) {
	if (data[INTERNALS$2].disturbed) {
		throw new TypeError(`body used already for: ${data.url}`);
	}
	data[INTERNALS$2].disturbed = true;
	if (data[INTERNALS$2].error) {
		throw data[INTERNALS$2].error;
	}
	let { body } = data;
	if (body === null) {
		return Buffer.alloc(0);
	}
	if (isBlob(body)) {
		body = import_stream.default.Readable.from(body.stream());
	}
	if (Buffer.isBuffer(body)) {
		return body;
	}
	if (!(body instanceof import_stream.default)) {
		return Buffer.alloc(0);
	}
	const accum = [];
	let accumBytes = 0;
	try {
		for await (const chunk of body) {
			if (data.size > 0 && accumBytes + chunk.length > data.size) {
				const error2 = new FetchError(
					`content size at ${data.url} over limit: ${data.size}`,
					'max-size'
				);
				body.destroy(error2);
				throw error2;
			}
			accumBytes += chunk.length;
			accum.push(chunk);
		}
	} catch (error2) {
		const error_ =
			error2 instanceof FetchBaseError
				? error2
				: new FetchError(
						`Invalid response body while trying to fetch ${data.url}: ${error2.message}`,
						'system',
						error2
				  );
		throw error_;
	}
	if (body.readableEnded === true || body._readableState.ended === true) {
		try {
			if (accum.every((c) => typeof c === 'string')) {
				return Buffer.from(accum.join(''));
			}
			return Buffer.concat(accum, accumBytes);
		} catch (error2) {
			throw new FetchError(
				`Could not create Buffer from response body for ${data.url}: ${error2.message}`,
				'system',
				error2
			);
		}
	} else {
		throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
	}
}
function fromRawHeaders(headers = []) {
	return new Headers(
		headers
			.reduce((result, value, index2, array) => {
				if (index2 % 2 === 0) {
					result.push(array.slice(index2, index2 + 2));
				}
				return result;
			}, [])
			.filter(([name, value]) => {
				try {
					validateHeaderName(name);
					validateHeaderValue(name, String(value));
					return true;
				} catch {
					return false;
				}
			})
	);
}
async function fetch(url, options_) {
	return new Promise((resolve2, reject) => {
		const request = new Request(url, options_);
		const options2 = getNodeRequestOptions(request);
		if (!supportedSchemas.has(options2.protocol)) {
			throw new TypeError(
				`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(
					/:$/,
					''
				)}" is not supported.`
			);
		}
		if (options2.protocol === 'data:') {
			const data = dataUriToBuffer$1(request.url);
			const response2 = new Response(data, { headers: { 'Content-Type': data.typeFull } });
			resolve2(response2);
			return;
		}
		const send = (options2.protocol === 'https:' ? import_https.default : import_http.default)
			.request;
		const { signal } = request;
		let response = null;
		const abort = () => {
			const error2 = new AbortError('The operation was aborted.');
			reject(error2);
			if (request.body && request.body instanceof import_stream.default.Readable) {
				request.body.destroy(error2);
			}
			if (!response || !response.body) {
				return;
			}
			response.body.emit('error', error2);
		};
		if (signal && signal.aborted) {
			abort();
			return;
		}
		const abortAndFinalize = () => {
			abort();
			finalize();
		};
		const request_ = send(options2);
		if (signal) {
			signal.addEventListener('abort', abortAndFinalize);
		}
		const finalize = () => {
			request_.abort();
			if (signal) {
				signal.removeEventListener('abort', abortAndFinalize);
			}
		};
		request_.on('error', (error2) => {
			reject(
				new FetchError(
					`request to ${request.url} failed, reason: ${error2.message}`,
					'system',
					error2
				)
			);
			finalize();
		});
		fixResponseChunkedTransferBadEnding(request_, (error2) => {
			response.body.destroy(error2);
		});
		if (process.version < 'v14') {
			request_.on('socket', (s2) => {
				let endedWithEventsCount;
				s2.prependListener('end', () => {
					endedWithEventsCount = s2._eventsCount;
				});
				s2.prependListener('close', (hadError) => {
					if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
						const error2 = new Error('Premature close');
						error2.code = 'ERR_STREAM_PREMATURE_CLOSE';
						response.body.emit('error', error2);
					}
				});
			});
		}
		request_.on('response', (response_) => {
			request_.setTimeout(0);
			const headers = fromRawHeaders(response_.rawHeaders);
			if (isRedirect(response_.statusCode)) {
				const location = headers.get('Location');
				const locationURL = location === null ? null : new URL(location, request.url);
				switch (request.redirect) {
					case 'error':
						reject(
							new FetchError(
								`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`,
								'no-redirect'
							)
						);
						finalize();
						return;
					case 'manual':
						if (locationURL !== null) {
							headers.set('Location', locationURL);
						}
						break;
					case 'follow': {
						if (locationURL === null) {
							break;
						}
						if (request.counter >= request.follow) {
							reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
							finalize();
							return;
						}
						const requestOptions = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: request.body,
							signal: request.signal,
							size: request.size
						};
						if (
							response_.statusCode !== 303 &&
							request.body &&
							options_.body instanceof import_stream.default.Readable
						) {
							reject(
								new FetchError(
									'Cannot follow redirect with body being a readable stream',
									'unsupported-redirect'
								)
							);
							finalize();
							return;
						}
						if (
							response_.statusCode === 303 ||
							((response_.statusCode === 301 || response_.statusCode === 302) &&
								request.method === 'POST')
						) {
							requestOptions.method = 'GET';
							requestOptions.body = void 0;
							requestOptions.headers.delete('content-length');
						}
						resolve2(fetch(new Request(locationURL, requestOptions)));
						finalize();
						return;
					}
					default:
						return reject(
							new TypeError(
								`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`
							)
						);
				}
			}
			if (signal) {
				response_.once('end', () => {
					signal.removeEventListener('abort', abortAndFinalize);
				});
			}
			let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
			if (process.version < 'v12.10') {
				response_.on('aborted', abortAndFinalize);
			}
			const responseOptions = {
				url: request.url,
				status: response_.statusCode,
				statusText: response_.statusMessage,
				headers,
				size: request.size,
				counter: request.counter,
				highWaterMark: request.highWaterMark
			};
			const codings = headers.get('Content-Encoding');
			if (
				!request.compress ||
				request.method === 'HEAD' ||
				codings === null ||
				response_.statusCode === 204 ||
				response_.statusCode === 304
			) {
				response = new Response(body, responseOptions);
				resolve2(response);
				return;
			}
			const zlibOptions = {
				flush: import_zlib.default.Z_SYNC_FLUSH,
				finishFlush: import_zlib.default.Z_SYNC_FLUSH
			};
			if (codings === 'gzip' || codings === 'x-gzip') {
				body = (0, import_stream.pipeline)(
					body,
					import_zlib.default.createGunzip(zlibOptions),
					reject
				);
				response = new Response(body, responseOptions);
				resolve2(response);
				return;
			}
			if (codings === 'deflate' || codings === 'x-deflate') {
				const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
				raw.once('data', (chunk) => {
					body =
						(chunk[0] & 15) === 8
							? (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), reject)
							: (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), reject);
					response = new Response(body, responseOptions);
					resolve2(response);
				});
				return;
			}
			if (codings === 'br') {
				body = (0, import_stream.pipeline)(
					body,
					import_zlib.default.createBrotliDecompress(),
					reject
				);
				response = new Response(body, responseOptions);
				resolve2(response);
				return;
			}
			response = new Response(body, responseOptions);
			resolve2(response);
		});
		writeToStream(request_, request);
	});
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
	const LAST_CHUNK = Buffer.from('0\r\n\r\n');
	let isChunkedTransfer = false;
	let properLastChunkReceived = false;
	let previousChunk;
	request.on('response', (response) => {
		const { headers } = response;
		isChunkedTransfer = headers['transfer-encoding'] === 'chunked' && !headers['content-length'];
	});
	request.on('socket', (socket) => {
		const onSocketClose = () => {
			if (isChunkedTransfer && !properLastChunkReceived) {
				const error2 = new Error('Premature close');
				error2.code = 'ERR_STREAM_PREMATURE_CLOSE';
				errorCallback(error2);
			}
		};
		socket.prependListener('close', onSocketClose);
		request.on('abort', () => {
			socket.removeListener('close', onSocketClose);
		});
		socket.on('data', (buf) => {
			properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
			if (!properLastChunkReceived && previousChunk) {
				properLastChunkReceived =
					Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 &&
					Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
			}
			previousChunk = buf;
		});
	});
}
var import_http,
	import_https,
	import_zlib,
	import_stream,
	import_util,
	import_crypto,
	import_url,
	commonjsGlobal,
	src,
	dataUriToBuffer$1,
	ponyfill_es2018,
	POOL_SIZE$1,
	POOL_SIZE,
	_Blob,
	Blob2,
	Blob$1,
	FetchBaseError,
	FetchError,
	NAME,
	isURLSearchParameters,
	isBlob,
	isAbortSignal,
	carriage,
	dashes,
	carriageLength,
	getFooter,
	getBoundary,
	INTERNALS$2,
	Body,
	clone,
	extractContentType,
	getTotalBytes,
	writeToStream,
	validateHeaderName,
	validateHeaderValue,
	Headers,
	redirectStatus,
	isRedirect,
	INTERNALS$1,
	Response,
	getSearch,
	INTERNALS,
	isRequest,
	Request,
	getNodeRequestOptions,
	AbortError,
	supportedSchemas;
var init_install_fetch = __esm({
	'node_modules/@sveltejs/kit/dist/install-fetch.js'() {
		init_shims();
		import_http = __toModule(require('http'));
		import_https = __toModule(require('https'));
		import_zlib = __toModule(require('zlib'));
		import_stream = __toModule(require('stream'));
		import_util = __toModule(require('util'));
		import_crypto = __toModule(require('crypto'));
		import_url = __toModule(require('url'));
		commonjsGlobal =
			typeof globalThis !== 'undefined'
				? globalThis
				: typeof window !== 'undefined'
				? window
				: typeof global !== 'undefined'
				? global
				: typeof self !== 'undefined'
				? self
				: {};
		src = dataUriToBuffer;
		dataUriToBuffer$1 = src;
		ponyfill_es2018 = { exports: {} };
		(function (module2, exports) {
			(function (global2, factory) {
				factory(exports);
			})(commonjsGlobal, function (exports2) {
				const SymbolPolyfill =
					typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
						? Symbol
						: (description) => `Symbol(${description})`;
				function noop2() {
					return void 0;
				}
				function getGlobals() {
					if (typeof self !== 'undefined') {
						return self;
					} else if (typeof window !== 'undefined') {
						return window;
					} else if (typeof commonjsGlobal !== 'undefined') {
						return commonjsGlobal;
					}
					return void 0;
				}
				const globals = getGlobals();
				function typeIsObject(x) {
					return (typeof x === 'object' && x !== null) || typeof x === 'function';
				}
				const rethrowAssertionErrorRejection = noop2;
				const originalPromise = Promise;
				const originalPromiseThen = Promise.prototype.then;
				const originalPromiseResolve = Promise.resolve.bind(originalPromise);
				const originalPromiseReject = Promise.reject.bind(originalPromise);
				function newPromise(executor) {
					return new originalPromise(executor);
				}
				function promiseResolvedWith(value) {
					return originalPromiseResolve(value);
				}
				function promiseRejectedWith(reason) {
					return originalPromiseReject(reason);
				}
				function PerformPromiseThen(promise, onFulfilled, onRejected) {
					return originalPromiseThen.call(promise, onFulfilled, onRejected);
				}
				function uponPromise(promise, onFulfilled, onRejected) {
					PerformPromiseThen(
						PerformPromiseThen(promise, onFulfilled, onRejected),
						void 0,
						rethrowAssertionErrorRejection
					);
				}
				function uponFulfillment(promise, onFulfilled) {
					uponPromise(promise, onFulfilled);
				}
				function uponRejection(promise, onRejected) {
					uponPromise(promise, void 0, onRejected);
				}
				function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
					return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
				}
				function setPromiseIsHandledToTrue(promise) {
					PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
				}
				const queueMicrotask = (() => {
					const globalQueueMicrotask = globals && globals.queueMicrotask;
					if (typeof globalQueueMicrotask === 'function') {
						return globalQueueMicrotask;
					}
					const resolvedPromise = promiseResolvedWith(void 0);
					return (fn) => PerformPromiseThen(resolvedPromise, fn);
				})();
				function reflectCall(F, V, args) {
					if (typeof F !== 'function') {
						throw new TypeError('Argument is not a function');
					}
					return Function.prototype.apply.call(F, V, args);
				}
				function promiseCall(F, V, args) {
					try {
						return promiseResolvedWith(reflectCall(F, V, args));
					} catch (value) {
						return promiseRejectedWith(value);
					}
				}
				const QUEUE_MAX_ARRAY_SIZE = 16384;
				class SimpleQueue {
					constructor() {
						this._cursor = 0;
						this._size = 0;
						this._front = {
							_elements: [],
							_next: void 0
						};
						this._back = this._front;
						this._cursor = 0;
						this._size = 0;
					}
					get length() {
						return this._size;
					}
					push(element) {
						const oldBack = this._back;
						let newBack = oldBack;
						if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
							newBack = {
								_elements: [],
								_next: void 0
							};
						}
						oldBack._elements.push(element);
						if (newBack !== oldBack) {
							this._back = newBack;
							oldBack._next = newBack;
						}
						++this._size;
					}
					shift() {
						const oldFront = this._front;
						let newFront = oldFront;
						const oldCursor = this._cursor;
						let newCursor = oldCursor + 1;
						const elements = oldFront._elements;
						const element = elements[oldCursor];
						if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
							newFront = oldFront._next;
							newCursor = 0;
						}
						--this._size;
						this._cursor = newCursor;
						if (oldFront !== newFront) {
							this._front = newFront;
						}
						elements[oldCursor] = void 0;
						return element;
					}
					forEach(callback) {
						let i = this._cursor;
						let node = this._front;
						let elements = node._elements;
						while (i !== elements.length || node._next !== void 0) {
							if (i === elements.length) {
								node = node._next;
								elements = node._elements;
								i = 0;
								if (elements.length === 0) {
									break;
								}
							}
							callback(elements[i]);
							++i;
						}
					}
					peek() {
						const front = this._front;
						const cursor = this._cursor;
						return front._elements[cursor];
					}
				}
				function ReadableStreamReaderGenericInitialize(reader, stream) {
					reader._ownerReadableStream = stream;
					stream._reader = reader;
					if (stream._state === 'readable') {
						defaultReaderClosedPromiseInitialize(reader);
					} else if (stream._state === 'closed') {
						defaultReaderClosedPromiseInitializeAsResolved(reader);
					} else {
						defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
					}
				}
				function ReadableStreamReaderGenericCancel(reader, reason) {
					const stream = reader._ownerReadableStream;
					return ReadableStreamCancel(stream, reason);
				}
				function ReadableStreamReaderGenericRelease(reader) {
					if (reader._ownerReadableStream._state === 'readable') {
						defaultReaderClosedPromiseReject(
							reader,
							new TypeError(
								`Reader was released and can no longer be used to monitor the stream's closedness`
							)
						);
					} else {
						defaultReaderClosedPromiseResetToRejected(
							reader,
							new TypeError(
								`Reader was released and can no longer be used to monitor the stream's closedness`
							)
						);
					}
					reader._ownerReadableStream._reader = void 0;
					reader._ownerReadableStream = void 0;
				}
				function readerLockException(name) {
					return new TypeError('Cannot ' + name + ' a stream using a released reader');
				}
				function defaultReaderClosedPromiseInitialize(reader) {
					reader._closedPromise = newPromise((resolve2, reject) => {
						reader._closedPromise_resolve = resolve2;
						reader._closedPromise_reject = reject;
					});
				}
				function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
					defaultReaderClosedPromiseInitialize(reader);
					defaultReaderClosedPromiseReject(reader, reason);
				}
				function defaultReaderClosedPromiseInitializeAsResolved(reader) {
					defaultReaderClosedPromiseInitialize(reader);
					defaultReaderClosedPromiseResolve(reader);
				}
				function defaultReaderClosedPromiseReject(reader, reason) {
					if (reader._closedPromise_reject === void 0) {
						return;
					}
					setPromiseIsHandledToTrue(reader._closedPromise);
					reader._closedPromise_reject(reason);
					reader._closedPromise_resolve = void 0;
					reader._closedPromise_reject = void 0;
				}
				function defaultReaderClosedPromiseResetToRejected(reader, reason) {
					defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
				}
				function defaultReaderClosedPromiseResolve(reader) {
					if (reader._closedPromise_resolve === void 0) {
						return;
					}
					reader._closedPromise_resolve(void 0);
					reader._closedPromise_resolve = void 0;
					reader._closedPromise_reject = void 0;
				}
				const AbortSteps = SymbolPolyfill('[[AbortSteps]]');
				const ErrorSteps = SymbolPolyfill('[[ErrorSteps]]');
				const CancelSteps = SymbolPolyfill('[[CancelSteps]]');
				const PullSteps = SymbolPolyfill('[[PullSteps]]');
				const NumberIsFinite =
					Number.isFinite ||
					function (x) {
						return typeof x === 'number' && isFinite(x);
					};
				const MathTrunc =
					Math.trunc ||
					function (v) {
						return v < 0 ? Math.ceil(v) : Math.floor(v);
					};
				function isDictionary(x) {
					return typeof x === 'object' || typeof x === 'function';
				}
				function assertDictionary(obj, context) {
					if (obj !== void 0 && !isDictionary(obj)) {
						throw new TypeError(`${context} is not an object.`);
					}
				}
				function assertFunction(x, context) {
					if (typeof x !== 'function') {
						throw new TypeError(`${context} is not a function.`);
					}
				}
				function isObject(x) {
					return (typeof x === 'object' && x !== null) || typeof x === 'function';
				}
				function assertObject(x, context) {
					if (!isObject(x)) {
						throw new TypeError(`${context} is not an object.`);
					}
				}
				function assertRequiredArgument(x, position, context) {
					if (x === void 0) {
						throw new TypeError(`Parameter ${position} is required in '${context}'.`);
					}
				}
				function assertRequiredField(x, field, context) {
					if (x === void 0) {
						throw new TypeError(`${field} is required in '${context}'.`);
					}
				}
				function convertUnrestrictedDouble(value) {
					return Number(value);
				}
				function censorNegativeZero(x) {
					return x === 0 ? 0 : x;
				}
				function integerPart(x) {
					return censorNegativeZero(MathTrunc(x));
				}
				function convertUnsignedLongLongWithEnforceRange(value, context) {
					const lowerBound = 0;
					const upperBound = Number.MAX_SAFE_INTEGER;
					let x = Number(value);
					x = censorNegativeZero(x);
					if (!NumberIsFinite(x)) {
						throw new TypeError(`${context} is not a finite number`);
					}
					x = integerPart(x);
					if (x < lowerBound || x > upperBound) {
						throw new TypeError(
							`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`
						);
					}
					if (!NumberIsFinite(x) || x === 0) {
						return 0;
					}
					return x;
				}
				function assertReadableStream(x, context) {
					if (!IsReadableStream(x)) {
						throw new TypeError(`${context} is not a ReadableStream.`);
					}
				}
				function AcquireReadableStreamDefaultReader(stream) {
					return new ReadableStreamDefaultReader(stream);
				}
				function ReadableStreamAddReadRequest(stream, readRequest) {
					stream._reader._readRequests.push(readRequest);
				}
				function ReadableStreamFulfillReadRequest(stream, chunk, done) {
					const reader = stream._reader;
					const readRequest = reader._readRequests.shift();
					if (done) {
						readRequest._closeSteps();
					} else {
						readRequest._chunkSteps(chunk);
					}
				}
				function ReadableStreamGetNumReadRequests(stream) {
					return stream._reader._readRequests.length;
				}
				function ReadableStreamHasDefaultReader(stream) {
					const reader = stream._reader;
					if (reader === void 0) {
						return false;
					}
					if (!IsReadableStreamDefaultReader(reader)) {
						return false;
					}
					return true;
				}
				class ReadableStreamDefaultReader {
					constructor(stream) {
						assertRequiredArgument(stream, 1, 'ReadableStreamDefaultReader');
						assertReadableStream(stream, 'First parameter');
						if (IsReadableStreamLocked(stream)) {
							throw new TypeError(
								'This stream has already been locked for exclusive reading by another reader'
							);
						}
						ReadableStreamReaderGenericInitialize(this, stream);
						this._readRequests = new SimpleQueue();
					}
					get closed() {
						if (!IsReadableStreamDefaultReader(this)) {
							return promiseRejectedWith(defaultReaderBrandCheckException('closed'));
						}
						return this._closedPromise;
					}
					cancel(reason = void 0) {
						if (!IsReadableStreamDefaultReader(this)) {
							return promiseRejectedWith(defaultReaderBrandCheckException('cancel'));
						}
						if (this._ownerReadableStream === void 0) {
							return promiseRejectedWith(readerLockException('cancel'));
						}
						return ReadableStreamReaderGenericCancel(this, reason);
					}
					read() {
						if (!IsReadableStreamDefaultReader(this)) {
							return promiseRejectedWith(defaultReaderBrandCheckException('read'));
						}
						if (this._ownerReadableStream === void 0) {
							return promiseRejectedWith(readerLockException('read from'));
						}
						let resolvePromise;
						let rejectPromise;
						const promise = newPromise((resolve2, reject) => {
							resolvePromise = resolve2;
							rejectPromise = reject;
						});
						const readRequest = {
							_chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
							_closeSteps: () => resolvePromise({ value: void 0, done: true }),
							_errorSteps: (e) => rejectPromise(e)
						};
						ReadableStreamDefaultReaderRead(this, readRequest);
						return promise;
					}
					releaseLock() {
						if (!IsReadableStreamDefaultReader(this)) {
							throw defaultReaderBrandCheckException('releaseLock');
						}
						if (this._ownerReadableStream === void 0) {
							return;
						}
						if (this._readRequests.length > 0) {
							throw new TypeError(
								'Tried to release a reader lock when that reader has pending read() calls un-settled'
							);
						}
						ReadableStreamReaderGenericRelease(this);
					}
				}
				Object.defineProperties(ReadableStreamDefaultReader.prototype, {
					cancel: { enumerable: true },
					read: { enumerable: true },
					releaseLock: { enumerable: true },
					closed: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
						value: 'ReadableStreamDefaultReader',
						configurable: true
					});
				}
				function IsReadableStreamDefaultReader(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_readRequests')) {
						return false;
					}
					return x instanceof ReadableStreamDefaultReader;
				}
				function ReadableStreamDefaultReaderRead(reader, readRequest) {
					const stream = reader._ownerReadableStream;
					stream._disturbed = true;
					if (stream._state === 'closed') {
						readRequest._closeSteps();
					} else if (stream._state === 'errored') {
						readRequest._errorSteps(stream._storedError);
					} else {
						stream._readableStreamController[PullSteps](readRequest);
					}
				}
				function defaultReaderBrandCheckException(name) {
					return new TypeError(
						`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`
					);
				}
				const AsyncIteratorPrototype = Object.getPrototypeOf(
					Object.getPrototypeOf(async function* () {}).prototype
				);
				class ReadableStreamAsyncIteratorImpl {
					constructor(reader, preventCancel) {
						this._ongoingPromise = void 0;
						this._isFinished = false;
						this._reader = reader;
						this._preventCancel = preventCancel;
					}
					next() {
						const nextSteps = () => this._nextSteps();
						this._ongoingPromise = this._ongoingPromise
							? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps)
							: nextSteps();
						return this._ongoingPromise;
					}
					return(value) {
						const returnSteps = () => this._returnSteps(value);
						return this._ongoingPromise
							? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps)
							: returnSteps();
					}
					_nextSteps() {
						if (this._isFinished) {
							return Promise.resolve({ value: void 0, done: true });
						}
						const reader = this._reader;
						if (reader._ownerReadableStream === void 0) {
							return promiseRejectedWith(readerLockException('iterate'));
						}
						let resolvePromise;
						let rejectPromise;
						const promise = newPromise((resolve2, reject) => {
							resolvePromise = resolve2;
							rejectPromise = reject;
						});
						const readRequest = {
							_chunkSteps: (chunk) => {
								this._ongoingPromise = void 0;
								queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
							},
							_closeSteps: () => {
								this._ongoingPromise = void 0;
								this._isFinished = true;
								ReadableStreamReaderGenericRelease(reader);
								resolvePromise({ value: void 0, done: true });
							},
							_errorSteps: (reason) => {
								this._ongoingPromise = void 0;
								this._isFinished = true;
								ReadableStreamReaderGenericRelease(reader);
								rejectPromise(reason);
							}
						};
						ReadableStreamDefaultReaderRead(reader, readRequest);
						return promise;
					}
					_returnSteps(value) {
						if (this._isFinished) {
							return Promise.resolve({ value, done: true });
						}
						this._isFinished = true;
						const reader = this._reader;
						if (reader._ownerReadableStream === void 0) {
							return promiseRejectedWith(readerLockException('finish iterating'));
						}
						if (!this._preventCancel) {
							const result = ReadableStreamReaderGenericCancel(reader, value);
							ReadableStreamReaderGenericRelease(reader);
							return transformPromiseWith(result, () => ({ value, done: true }));
						}
						ReadableStreamReaderGenericRelease(reader);
						return promiseResolvedWith({ value, done: true });
					}
				}
				const ReadableStreamAsyncIteratorPrototype = {
					next() {
						if (!IsReadableStreamAsyncIterator(this)) {
							return promiseRejectedWith(streamAsyncIteratorBrandCheckException('next'));
						}
						return this._asyncIteratorImpl.next();
					},
					return(value) {
						if (!IsReadableStreamAsyncIterator(this)) {
							return promiseRejectedWith(streamAsyncIteratorBrandCheckException('return'));
						}
						return this._asyncIteratorImpl.return(value);
					}
				};
				if (AsyncIteratorPrototype !== void 0) {
					Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
				}
				function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
					const reader = AcquireReadableStreamDefaultReader(stream);
					const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
					const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
					iterator._asyncIteratorImpl = impl;
					return iterator;
				}
				function IsReadableStreamAsyncIterator(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_asyncIteratorImpl')) {
						return false;
					}
					try {
						return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
					} catch (_a) {
						return false;
					}
				}
				function streamAsyncIteratorBrandCheckException(name) {
					return new TypeError(
						`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`
					);
				}
				const NumberIsNaN =
					Number.isNaN ||
					function (x) {
						return x !== x;
					};
				function CreateArrayFromList(elements) {
					return elements.slice();
				}
				function CopyDataBlockBytes(dest, destOffset, src2, srcOffset, n) {
					new Uint8Array(dest).set(new Uint8Array(src2, srcOffset, n), destOffset);
				}
				function TransferArrayBuffer(O) {
					return O;
				}
				function IsDetachedBuffer(O) {
					return false;
				}
				function ArrayBufferSlice(buffer, begin, end) {
					if (buffer.slice) {
						return buffer.slice(begin, end);
					}
					const length = end - begin;
					const slice = new ArrayBuffer(length);
					CopyDataBlockBytes(slice, 0, buffer, begin, length);
					return slice;
				}
				function IsNonNegativeNumber(v) {
					if (typeof v !== 'number') {
						return false;
					}
					if (NumberIsNaN(v)) {
						return false;
					}
					if (v < 0) {
						return false;
					}
					return true;
				}
				function CloneAsUint8Array(O) {
					const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
					return new Uint8Array(buffer);
				}
				function DequeueValue(container) {
					const pair = container._queue.shift();
					container._queueTotalSize -= pair.size;
					if (container._queueTotalSize < 0) {
						container._queueTotalSize = 0;
					}
					return pair.value;
				}
				function EnqueueValueWithSize(container, value, size) {
					if (!IsNonNegativeNumber(size) || size === Infinity) {
						throw new RangeError('Size must be a finite, non-NaN, non-negative number.');
					}
					container._queue.push({ value, size });
					container._queueTotalSize += size;
				}
				function PeekQueueValue(container) {
					const pair = container._queue.peek();
					return pair.value;
				}
				function ResetQueue(container) {
					container._queue = new SimpleQueue();
					container._queueTotalSize = 0;
				}
				class ReadableStreamBYOBRequest {
					constructor() {
						throw new TypeError('Illegal constructor');
					}
					get view() {
						if (!IsReadableStreamBYOBRequest(this)) {
							throw byobRequestBrandCheckException('view');
						}
						return this._view;
					}
					respond(bytesWritten) {
						if (!IsReadableStreamBYOBRequest(this)) {
							throw byobRequestBrandCheckException('respond');
						}
						assertRequiredArgument(bytesWritten, 1, 'respond');
						bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, 'First parameter');
						if (this._associatedReadableByteStreamController === void 0) {
							throw new TypeError('This BYOB request has been invalidated');
						}
						if (IsDetachedBuffer(this._view.buffer));
						ReadableByteStreamControllerRespond(
							this._associatedReadableByteStreamController,
							bytesWritten
						);
					}
					respondWithNewView(view) {
						if (!IsReadableStreamBYOBRequest(this)) {
							throw byobRequestBrandCheckException('respondWithNewView');
						}
						assertRequiredArgument(view, 1, 'respondWithNewView');
						if (!ArrayBuffer.isView(view)) {
							throw new TypeError('You can only respond with array buffer views');
						}
						if (this._associatedReadableByteStreamController === void 0) {
							throw new TypeError('This BYOB request has been invalidated');
						}
						if (IsDetachedBuffer(view.buffer));
						ReadableByteStreamControllerRespondWithNewView(
							this._associatedReadableByteStreamController,
							view
						);
					}
				}
				Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
					respond: { enumerable: true },
					respondWithNewView: { enumerable: true },
					view: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
						value: 'ReadableStreamBYOBRequest',
						configurable: true
					});
				}
				class ReadableByteStreamController {
					constructor() {
						throw new TypeError('Illegal constructor');
					}
					get byobRequest() {
						if (!IsReadableByteStreamController(this)) {
							throw byteStreamControllerBrandCheckException('byobRequest');
						}
						return ReadableByteStreamControllerGetBYOBRequest(this);
					}
					get desiredSize() {
						if (!IsReadableByteStreamController(this)) {
							throw byteStreamControllerBrandCheckException('desiredSize');
						}
						return ReadableByteStreamControllerGetDesiredSize(this);
					}
					close() {
						if (!IsReadableByteStreamController(this)) {
							throw byteStreamControllerBrandCheckException('close');
						}
						if (this._closeRequested) {
							throw new TypeError('The stream has already been closed; do not close it again!');
						}
						const state = this._controlledReadableByteStream._state;
						if (state !== 'readable') {
							throw new TypeError(
								`The stream (in ${state} state) is not in the readable state and cannot be closed`
							);
						}
						ReadableByteStreamControllerClose(this);
					}
					enqueue(chunk) {
						if (!IsReadableByteStreamController(this)) {
							throw byteStreamControllerBrandCheckException('enqueue');
						}
						assertRequiredArgument(chunk, 1, 'enqueue');
						if (!ArrayBuffer.isView(chunk)) {
							throw new TypeError('chunk must be an array buffer view');
						}
						if (chunk.byteLength === 0) {
							throw new TypeError('chunk must have non-zero byteLength');
						}
						if (chunk.buffer.byteLength === 0) {
							throw new TypeError(`chunk's buffer must have non-zero byteLength`);
						}
						if (this._closeRequested) {
							throw new TypeError('stream is closed or draining');
						}
						const state = this._controlledReadableByteStream._state;
						if (state !== 'readable') {
							throw new TypeError(
								`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`
							);
						}
						ReadableByteStreamControllerEnqueue(this, chunk);
					}
					error(e = void 0) {
						if (!IsReadableByteStreamController(this)) {
							throw byteStreamControllerBrandCheckException('error');
						}
						ReadableByteStreamControllerError(this, e);
					}
					[CancelSteps](reason) {
						ReadableByteStreamControllerClearPendingPullIntos(this);
						ResetQueue(this);
						const result = this._cancelAlgorithm(reason);
						ReadableByteStreamControllerClearAlgorithms(this);
						return result;
					}
					[PullSteps](readRequest) {
						const stream = this._controlledReadableByteStream;
						if (this._queueTotalSize > 0) {
							const entry = this._queue.shift();
							this._queueTotalSize -= entry.byteLength;
							ReadableByteStreamControllerHandleQueueDrain(this);
							const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
							readRequest._chunkSteps(view);
							return;
						}
						const autoAllocateChunkSize = this._autoAllocateChunkSize;
						if (autoAllocateChunkSize !== void 0) {
							let buffer;
							try {
								buffer = new ArrayBuffer(autoAllocateChunkSize);
							} catch (bufferE) {
								readRequest._errorSteps(bufferE);
								return;
							}
							const pullIntoDescriptor = {
								buffer,
								bufferByteLength: autoAllocateChunkSize,
								byteOffset: 0,
								byteLength: autoAllocateChunkSize,
								bytesFilled: 0,
								elementSize: 1,
								viewConstructor: Uint8Array,
								readerType: 'default'
							};
							this._pendingPullIntos.push(pullIntoDescriptor);
						}
						ReadableStreamAddReadRequest(stream, readRequest);
						ReadableByteStreamControllerCallPullIfNeeded(this);
					}
				}
				Object.defineProperties(ReadableByteStreamController.prototype, {
					close: { enumerable: true },
					enqueue: { enumerable: true },
					error: { enumerable: true },
					byobRequest: { enumerable: true },
					desiredSize: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(
						ReadableByteStreamController.prototype,
						SymbolPolyfill.toStringTag,
						{
							value: 'ReadableByteStreamController',
							configurable: true
						}
					);
				}
				function IsReadableByteStreamController(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_controlledReadableByteStream')) {
						return false;
					}
					return x instanceof ReadableByteStreamController;
				}
				function IsReadableStreamBYOBRequest(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_associatedReadableByteStreamController')) {
						return false;
					}
					return x instanceof ReadableStreamBYOBRequest;
				}
				function ReadableByteStreamControllerCallPullIfNeeded(controller) {
					const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
					if (!shouldPull) {
						return;
					}
					if (controller._pulling) {
						controller._pullAgain = true;
						return;
					}
					controller._pulling = true;
					const pullPromise = controller._pullAlgorithm();
					uponPromise(
						pullPromise,
						() => {
							controller._pulling = false;
							if (controller._pullAgain) {
								controller._pullAgain = false;
								ReadableByteStreamControllerCallPullIfNeeded(controller);
							}
						},
						(e) => {
							ReadableByteStreamControllerError(controller, e);
						}
					);
				}
				function ReadableByteStreamControllerClearPendingPullIntos(controller) {
					ReadableByteStreamControllerInvalidateBYOBRequest(controller);
					controller._pendingPullIntos = new SimpleQueue();
				}
				function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
					let done = false;
					if (stream._state === 'closed') {
						done = true;
					}
					const filledView =
						ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
					if (pullIntoDescriptor.readerType === 'default') {
						ReadableStreamFulfillReadRequest(stream, filledView, done);
					} else {
						ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
					}
				}
				function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
					const bytesFilled = pullIntoDescriptor.bytesFilled;
					const elementSize = pullIntoDescriptor.elementSize;
					return new pullIntoDescriptor.viewConstructor(
						pullIntoDescriptor.buffer,
						pullIntoDescriptor.byteOffset,
						bytesFilled / elementSize
					);
				}
				function ReadableByteStreamControllerEnqueueChunkToQueue(
					controller,
					buffer,
					byteOffset,
					byteLength
				) {
					controller._queue.push({ buffer, byteOffset, byteLength });
					controller._queueTotalSize += byteLength;
				}
				function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
					controller,
					pullIntoDescriptor
				) {
					const elementSize = pullIntoDescriptor.elementSize;
					const currentAlignedBytes =
						pullIntoDescriptor.bytesFilled - (pullIntoDescriptor.bytesFilled % elementSize);
					const maxBytesToCopy = Math.min(
						controller._queueTotalSize,
						pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled
					);
					const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
					const maxAlignedBytes = maxBytesFilled - (maxBytesFilled % elementSize);
					let totalBytesToCopyRemaining = maxBytesToCopy;
					let ready = false;
					if (maxAlignedBytes > currentAlignedBytes) {
						totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
						ready = true;
					}
					const queue = controller._queue;
					while (totalBytesToCopyRemaining > 0) {
						const headOfQueue = queue.peek();
						const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
						const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
						CopyDataBlockBytes(
							pullIntoDescriptor.buffer,
							destStart,
							headOfQueue.buffer,
							headOfQueue.byteOffset,
							bytesToCopy
						);
						if (headOfQueue.byteLength === bytesToCopy) {
							queue.shift();
						} else {
							headOfQueue.byteOffset += bytesToCopy;
							headOfQueue.byteLength -= bytesToCopy;
						}
						controller._queueTotalSize -= bytesToCopy;
						ReadableByteStreamControllerFillHeadPullIntoDescriptor(
							controller,
							bytesToCopy,
							pullIntoDescriptor
						);
						totalBytesToCopyRemaining -= bytesToCopy;
					}
					return ready;
				}
				function ReadableByteStreamControllerFillHeadPullIntoDescriptor(
					controller,
					size,
					pullIntoDescriptor
				) {
					pullIntoDescriptor.bytesFilled += size;
				}
				function ReadableByteStreamControllerHandleQueueDrain(controller) {
					if (controller._queueTotalSize === 0 && controller._closeRequested) {
						ReadableByteStreamControllerClearAlgorithms(controller);
						ReadableStreamClose(controller._controlledReadableByteStream);
					} else {
						ReadableByteStreamControllerCallPullIfNeeded(controller);
					}
				}
				function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
					if (controller._byobRequest === null) {
						return;
					}
					controller._byobRequest._associatedReadableByteStreamController = void 0;
					controller._byobRequest._view = null;
					controller._byobRequest = null;
				}
				function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
					while (controller._pendingPullIntos.length > 0) {
						if (controller._queueTotalSize === 0) {
							return;
						}
						const pullIntoDescriptor = controller._pendingPullIntos.peek();
						if (
							ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
								controller,
								pullIntoDescriptor
							)
						) {
							ReadableByteStreamControllerShiftPendingPullInto(controller);
							ReadableByteStreamControllerCommitPullIntoDescriptor(
								controller._controlledReadableByteStream,
								pullIntoDescriptor
							);
						}
					}
				}
				function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
					const stream = controller._controlledReadableByteStream;
					let elementSize = 1;
					if (view.constructor !== DataView) {
						elementSize = view.constructor.BYTES_PER_ELEMENT;
					}
					const ctor = view.constructor;
					const buffer = TransferArrayBuffer(view.buffer);
					const pullIntoDescriptor = {
						buffer,
						bufferByteLength: buffer.byteLength,
						byteOffset: view.byteOffset,
						byteLength: view.byteLength,
						bytesFilled: 0,
						elementSize,
						viewConstructor: ctor,
						readerType: 'byob'
					};
					if (controller._pendingPullIntos.length > 0) {
						controller._pendingPullIntos.push(pullIntoDescriptor);
						ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
						return;
					}
					if (stream._state === 'closed') {
						const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
						readIntoRequest._closeSteps(emptyView);
						return;
					}
					if (controller._queueTotalSize > 0) {
						if (
							ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
								controller,
								pullIntoDescriptor
							)
						) {
							const filledView =
								ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
							ReadableByteStreamControllerHandleQueueDrain(controller);
							readIntoRequest._chunkSteps(filledView);
							return;
						}
						if (controller._closeRequested) {
							const e = new TypeError('Insufficient bytes to fill elements in the given buffer');
							ReadableByteStreamControllerError(controller, e);
							readIntoRequest._errorSteps(e);
							return;
						}
					}
					controller._pendingPullIntos.push(pullIntoDescriptor);
					ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
					ReadableByteStreamControllerCallPullIfNeeded(controller);
				}
				function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
					const stream = controller._controlledReadableByteStream;
					if (ReadableStreamHasBYOBReader(stream)) {
						while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
							const pullIntoDescriptor =
								ReadableByteStreamControllerShiftPendingPullInto(controller);
							ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
						}
					}
				}
				function ReadableByteStreamControllerRespondInReadableState(
					controller,
					bytesWritten,
					pullIntoDescriptor
				) {
					ReadableByteStreamControllerFillHeadPullIntoDescriptor(
						controller,
						bytesWritten,
						pullIntoDescriptor
					);
					if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
						return;
					}
					ReadableByteStreamControllerShiftPendingPullInto(controller);
					const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
					if (remainderSize > 0) {
						const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
						const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
						ReadableByteStreamControllerEnqueueChunkToQueue(
							controller,
							remainder,
							0,
							remainder.byteLength
						);
					}
					pullIntoDescriptor.bytesFilled -= remainderSize;
					ReadableByteStreamControllerCommitPullIntoDescriptor(
						controller._controlledReadableByteStream,
						pullIntoDescriptor
					);
					ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
				}
				function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
					const firstDescriptor = controller._pendingPullIntos.peek();
					ReadableByteStreamControllerInvalidateBYOBRequest(controller);
					const state = controller._controlledReadableByteStream._state;
					if (state === 'closed') {
						ReadableByteStreamControllerRespondInClosedState(controller);
					} else {
						ReadableByteStreamControllerRespondInReadableState(
							controller,
							bytesWritten,
							firstDescriptor
						);
					}
					ReadableByteStreamControllerCallPullIfNeeded(controller);
				}
				function ReadableByteStreamControllerShiftPendingPullInto(controller) {
					const descriptor = controller._pendingPullIntos.shift();
					return descriptor;
				}
				function ReadableByteStreamControllerShouldCallPull(controller) {
					const stream = controller._controlledReadableByteStream;
					if (stream._state !== 'readable') {
						return false;
					}
					if (controller._closeRequested) {
						return false;
					}
					if (!controller._started) {
						return false;
					}
					if (
						ReadableStreamHasDefaultReader(stream) &&
						ReadableStreamGetNumReadRequests(stream) > 0
					) {
						return true;
					}
					if (
						ReadableStreamHasBYOBReader(stream) &&
						ReadableStreamGetNumReadIntoRequests(stream) > 0
					) {
						return true;
					}
					const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
					if (desiredSize > 0) {
						return true;
					}
					return false;
				}
				function ReadableByteStreamControllerClearAlgorithms(controller) {
					controller._pullAlgorithm = void 0;
					controller._cancelAlgorithm = void 0;
				}
				function ReadableByteStreamControllerClose(controller) {
					const stream = controller._controlledReadableByteStream;
					if (controller._closeRequested || stream._state !== 'readable') {
						return;
					}
					if (controller._queueTotalSize > 0) {
						controller._closeRequested = true;
						return;
					}
					if (controller._pendingPullIntos.length > 0) {
						const firstPendingPullInto = controller._pendingPullIntos.peek();
						if (firstPendingPullInto.bytesFilled > 0) {
							const e = new TypeError('Insufficient bytes to fill elements in the given buffer');
							ReadableByteStreamControllerError(controller, e);
							throw e;
						}
					}
					ReadableByteStreamControllerClearAlgorithms(controller);
					ReadableStreamClose(stream);
				}
				function ReadableByteStreamControllerEnqueue(controller, chunk) {
					const stream = controller._controlledReadableByteStream;
					if (controller._closeRequested || stream._state !== 'readable') {
						return;
					}
					const buffer = chunk.buffer;
					const byteOffset = chunk.byteOffset;
					const byteLength = chunk.byteLength;
					const transferredBuffer = TransferArrayBuffer(buffer);
					if (controller._pendingPullIntos.length > 0) {
						const firstPendingPullInto = controller._pendingPullIntos.peek();
						if (IsDetachedBuffer(firstPendingPullInto.buffer));
						firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
					}
					ReadableByteStreamControllerInvalidateBYOBRequest(controller);
					if (ReadableStreamHasDefaultReader(stream)) {
						if (ReadableStreamGetNumReadRequests(stream) === 0) {
							ReadableByteStreamControllerEnqueueChunkToQueue(
								controller,
								transferredBuffer,
								byteOffset,
								byteLength
							);
						} else {
							const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
							ReadableStreamFulfillReadRequest(stream, transferredView, false);
						}
					} else if (ReadableStreamHasBYOBReader(stream)) {
						ReadableByteStreamControllerEnqueueChunkToQueue(
							controller,
							transferredBuffer,
							byteOffset,
							byteLength
						);
						ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
					} else {
						ReadableByteStreamControllerEnqueueChunkToQueue(
							controller,
							transferredBuffer,
							byteOffset,
							byteLength
						);
					}
					ReadableByteStreamControllerCallPullIfNeeded(controller);
				}
				function ReadableByteStreamControllerError(controller, e) {
					const stream = controller._controlledReadableByteStream;
					if (stream._state !== 'readable') {
						return;
					}
					ReadableByteStreamControllerClearPendingPullIntos(controller);
					ResetQueue(controller);
					ReadableByteStreamControllerClearAlgorithms(controller);
					ReadableStreamError(stream, e);
				}
				function ReadableByteStreamControllerGetBYOBRequest(controller) {
					if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
						const firstDescriptor = controller._pendingPullIntos.peek();
						const view = new Uint8Array(
							firstDescriptor.buffer,
							firstDescriptor.byteOffset + firstDescriptor.bytesFilled,
							firstDescriptor.byteLength - firstDescriptor.bytesFilled
						);
						const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
						SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
						controller._byobRequest = byobRequest;
					}
					return controller._byobRequest;
				}
				function ReadableByteStreamControllerGetDesiredSize(controller) {
					const state = controller._controlledReadableByteStream._state;
					if (state === 'errored') {
						return null;
					}
					if (state === 'closed') {
						return 0;
					}
					return controller._strategyHWM - controller._queueTotalSize;
				}
				function ReadableByteStreamControllerRespond(controller, bytesWritten) {
					const firstDescriptor = controller._pendingPullIntos.peek();
					const state = controller._controlledReadableByteStream._state;
					if (state === 'closed') {
						if (bytesWritten !== 0) {
							throw new TypeError(
								'bytesWritten must be 0 when calling respond() on a closed stream'
							);
						}
					} else {
						if (bytesWritten === 0) {
							throw new TypeError(
								'bytesWritten must be greater than 0 when calling respond() on a readable stream'
							);
						}
						if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
							throw new RangeError('bytesWritten out of range');
						}
					}
					firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
					ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
				}
				function ReadableByteStreamControllerRespondWithNewView(controller, view) {
					const firstDescriptor = controller._pendingPullIntos.peek();
					const state = controller._controlledReadableByteStream._state;
					if (state === 'closed') {
						if (view.byteLength !== 0) {
							throw new TypeError(
								"The view's length must be 0 when calling respondWithNewView() on a closed stream"
							);
						}
					} else {
						if (view.byteLength === 0) {
							throw new TypeError(
								"The view's length must be greater than 0 when calling respondWithNewView() on a readable stream"
							);
						}
					}
					if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
						throw new RangeError('The region specified by view does not match byobRequest');
					}
					if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
						throw new RangeError('The buffer of view has different capacity than byobRequest');
					}
					if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
						throw new RangeError('The region specified by view is larger than byobRequest');
					}
					firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
					ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
				}
				function SetUpReadableByteStreamController(
					stream,
					controller,
					startAlgorithm,
					pullAlgorithm,
					cancelAlgorithm,
					highWaterMark,
					autoAllocateChunkSize
				) {
					controller._controlledReadableByteStream = stream;
					controller._pullAgain = false;
					controller._pulling = false;
					controller._byobRequest = null;
					controller._queue = controller._queueTotalSize = void 0;
					ResetQueue(controller);
					controller._closeRequested = false;
					controller._started = false;
					controller._strategyHWM = highWaterMark;
					controller._pullAlgorithm = pullAlgorithm;
					controller._cancelAlgorithm = cancelAlgorithm;
					controller._autoAllocateChunkSize = autoAllocateChunkSize;
					controller._pendingPullIntos = new SimpleQueue();
					stream._readableStreamController = controller;
					const startResult = startAlgorithm();
					uponPromise(
						promiseResolvedWith(startResult),
						() => {
							controller._started = true;
							ReadableByteStreamControllerCallPullIfNeeded(controller);
						},
						(r) => {
							ReadableByteStreamControllerError(controller, r);
						}
					);
				}
				function SetUpReadableByteStreamControllerFromUnderlyingSource(
					stream,
					underlyingByteSource,
					highWaterMark
				) {
					const controller = Object.create(ReadableByteStreamController.prototype);
					let startAlgorithm = () => void 0;
					let pullAlgorithm = () => promiseResolvedWith(void 0);
					let cancelAlgorithm = () => promiseResolvedWith(void 0);
					if (underlyingByteSource.start !== void 0) {
						startAlgorithm = () => underlyingByteSource.start(controller);
					}
					if (underlyingByteSource.pull !== void 0) {
						pullAlgorithm = () => underlyingByteSource.pull(controller);
					}
					if (underlyingByteSource.cancel !== void 0) {
						cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
					}
					const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
					if (autoAllocateChunkSize === 0) {
						throw new TypeError('autoAllocateChunkSize must be greater than 0');
					}
					SetUpReadableByteStreamController(
						stream,
						controller,
						startAlgorithm,
						pullAlgorithm,
						cancelAlgorithm,
						highWaterMark,
						autoAllocateChunkSize
					);
				}
				function SetUpReadableStreamBYOBRequest(request, controller, view) {
					request._associatedReadableByteStreamController = controller;
					request._view = view;
				}
				function byobRequestBrandCheckException(name) {
					return new TypeError(
						`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`
					);
				}
				function byteStreamControllerBrandCheckException(name) {
					return new TypeError(
						`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`
					);
				}
				function AcquireReadableStreamBYOBReader(stream) {
					return new ReadableStreamBYOBReader(stream);
				}
				function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
					stream._reader._readIntoRequests.push(readIntoRequest);
				}
				function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
					const reader = stream._reader;
					const readIntoRequest = reader._readIntoRequests.shift();
					if (done) {
						readIntoRequest._closeSteps(chunk);
					} else {
						readIntoRequest._chunkSteps(chunk);
					}
				}
				function ReadableStreamGetNumReadIntoRequests(stream) {
					return stream._reader._readIntoRequests.length;
				}
				function ReadableStreamHasBYOBReader(stream) {
					const reader = stream._reader;
					if (reader === void 0) {
						return false;
					}
					if (!IsReadableStreamBYOBReader(reader)) {
						return false;
					}
					return true;
				}
				class ReadableStreamBYOBReader {
					constructor(stream) {
						assertRequiredArgument(stream, 1, 'ReadableStreamBYOBReader');
						assertReadableStream(stream, 'First parameter');
						if (IsReadableStreamLocked(stream)) {
							throw new TypeError(
								'This stream has already been locked for exclusive reading by another reader'
							);
						}
						if (!IsReadableByteStreamController(stream._readableStreamController)) {
							throw new TypeError(
								'Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source'
							);
						}
						ReadableStreamReaderGenericInitialize(this, stream);
						this._readIntoRequests = new SimpleQueue();
					}
					get closed() {
						if (!IsReadableStreamBYOBReader(this)) {
							return promiseRejectedWith(byobReaderBrandCheckException('closed'));
						}
						return this._closedPromise;
					}
					cancel(reason = void 0) {
						if (!IsReadableStreamBYOBReader(this)) {
							return promiseRejectedWith(byobReaderBrandCheckException('cancel'));
						}
						if (this._ownerReadableStream === void 0) {
							return promiseRejectedWith(readerLockException('cancel'));
						}
						return ReadableStreamReaderGenericCancel(this, reason);
					}
					read(view) {
						if (!IsReadableStreamBYOBReader(this)) {
							return promiseRejectedWith(byobReaderBrandCheckException('read'));
						}
						if (!ArrayBuffer.isView(view)) {
							return promiseRejectedWith(new TypeError('view must be an array buffer view'));
						}
						if (view.byteLength === 0) {
							return promiseRejectedWith(new TypeError('view must have non-zero byteLength'));
						}
						if (view.buffer.byteLength === 0) {
							return promiseRejectedWith(
								new TypeError(`view's buffer must have non-zero byteLength`)
							);
						}
						if (IsDetachedBuffer(view.buffer));
						if (this._ownerReadableStream === void 0) {
							return promiseRejectedWith(readerLockException('read from'));
						}
						let resolvePromise;
						let rejectPromise;
						const promise = newPromise((resolve2, reject) => {
							resolvePromise = resolve2;
							rejectPromise = reject;
						});
						const readIntoRequest = {
							_chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
							_closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
							_errorSteps: (e) => rejectPromise(e)
						};
						ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
						return promise;
					}
					releaseLock() {
						if (!IsReadableStreamBYOBReader(this)) {
							throw byobReaderBrandCheckException('releaseLock');
						}
						if (this._ownerReadableStream === void 0) {
							return;
						}
						if (this._readIntoRequests.length > 0) {
							throw new TypeError(
								'Tried to release a reader lock when that reader has pending read() calls un-settled'
							);
						}
						ReadableStreamReaderGenericRelease(this);
					}
				}
				Object.defineProperties(ReadableStreamBYOBReader.prototype, {
					cancel: { enumerable: true },
					read: { enumerable: true },
					releaseLock: { enumerable: true },
					closed: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
						value: 'ReadableStreamBYOBReader',
						configurable: true
					});
				}
				function IsReadableStreamBYOBReader(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_readIntoRequests')) {
						return false;
					}
					return x instanceof ReadableStreamBYOBReader;
				}
				function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
					const stream = reader._ownerReadableStream;
					stream._disturbed = true;
					if (stream._state === 'errored') {
						readIntoRequest._errorSteps(stream._storedError);
					} else {
						ReadableByteStreamControllerPullInto(
							stream._readableStreamController,
							view,
							readIntoRequest
						);
					}
				}
				function byobReaderBrandCheckException(name) {
					return new TypeError(
						`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`
					);
				}
				function ExtractHighWaterMark(strategy, defaultHWM) {
					const { highWaterMark } = strategy;
					if (highWaterMark === void 0) {
						return defaultHWM;
					}
					if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
						throw new RangeError('Invalid highWaterMark');
					}
					return highWaterMark;
				}
				function ExtractSizeAlgorithm(strategy) {
					const { size } = strategy;
					if (!size) {
						return () => 1;
					}
					return size;
				}
				function convertQueuingStrategy(init2, context) {
					assertDictionary(init2, context);
					const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
					const size = init2 === null || init2 === void 0 ? void 0 : init2.size;
					return {
						highWaterMark:
							highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
						size:
							size === void 0
								? void 0
								: convertQueuingStrategySize(size, `${context} has member 'size' that`)
					};
				}
				function convertQueuingStrategySize(fn, context) {
					assertFunction(fn, context);
					return (chunk) => convertUnrestrictedDouble(fn(chunk));
				}
				function convertUnderlyingSink(original, context) {
					assertDictionary(original, context);
					const abort = original === null || original === void 0 ? void 0 : original.abort;
					const close = original === null || original === void 0 ? void 0 : original.close;
					const start = original === null || original === void 0 ? void 0 : original.start;
					const type = original === null || original === void 0 ? void 0 : original.type;
					const write = original === null || original === void 0 ? void 0 : original.write;
					return {
						abort:
							abort === void 0
								? void 0
								: convertUnderlyingSinkAbortCallback(
										abort,
										original,
										`${context} has member 'abort' that`
								  ),
						close:
							close === void 0
								? void 0
								: convertUnderlyingSinkCloseCallback(
										close,
										original,
										`${context} has member 'close' that`
								  ),
						start:
							start === void 0
								? void 0
								: convertUnderlyingSinkStartCallback(
										start,
										original,
										`${context} has member 'start' that`
								  ),
						write:
							write === void 0
								? void 0
								: convertUnderlyingSinkWriteCallback(
										write,
										original,
										`${context} has member 'write' that`
								  ),
						type
					};
				}
				function convertUnderlyingSinkAbortCallback(fn, original, context) {
					assertFunction(fn, context);
					return (reason) => promiseCall(fn, original, [reason]);
				}
				function convertUnderlyingSinkCloseCallback(fn, original, context) {
					assertFunction(fn, context);
					return () => promiseCall(fn, original, []);
				}
				function convertUnderlyingSinkStartCallback(fn, original, context) {
					assertFunction(fn, context);
					return (controller) => reflectCall(fn, original, [controller]);
				}
				function convertUnderlyingSinkWriteCallback(fn, original, context) {
					assertFunction(fn, context);
					return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
				}
				function assertWritableStream(x, context) {
					if (!IsWritableStream(x)) {
						throw new TypeError(`${context} is not a WritableStream.`);
					}
				}
				function isAbortSignal2(value) {
					if (typeof value !== 'object' || value === null) {
						return false;
					}
					try {
						return typeof value.aborted === 'boolean';
					} catch (_a) {
						return false;
					}
				}
				const supportsAbortController = typeof AbortController === 'function';
				function createAbortController() {
					if (supportsAbortController) {
						return new AbortController();
					}
					return void 0;
				}
				class WritableStream {
					constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
						if (rawUnderlyingSink === void 0) {
							rawUnderlyingSink = null;
						} else {
							assertObject(rawUnderlyingSink, 'First parameter');
						}
						const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter');
						const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, 'First parameter');
						InitializeWritableStream(this);
						const type = underlyingSink.type;
						if (type !== void 0) {
							throw new RangeError('Invalid type is specified');
						}
						const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
						const highWaterMark = ExtractHighWaterMark(strategy, 1);
						SetUpWritableStreamDefaultControllerFromUnderlyingSink(
							this,
							underlyingSink,
							highWaterMark,
							sizeAlgorithm
						);
					}
					get locked() {
						if (!IsWritableStream(this)) {
							throw streamBrandCheckException$2('locked');
						}
						return IsWritableStreamLocked(this);
					}
					abort(reason = void 0) {
						if (!IsWritableStream(this)) {
							return promiseRejectedWith(streamBrandCheckException$2('abort'));
						}
						if (IsWritableStreamLocked(this)) {
							return promiseRejectedWith(
								new TypeError('Cannot abort a stream that already has a writer')
							);
						}
						return WritableStreamAbort(this, reason);
					}
					close() {
						if (!IsWritableStream(this)) {
							return promiseRejectedWith(streamBrandCheckException$2('close'));
						}
						if (IsWritableStreamLocked(this)) {
							return promiseRejectedWith(
								new TypeError('Cannot close a stream that already has a writer')
							);
						}
						if (WritableStreamCloseQueuedOrInFlight(this)) {
							return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'));
						}
						return WritableStreamClose(this);
					}
					getWriter() {
						if (!IsWritableStream(this)) {
							throw streamBrandCheckException$2('getWriter');
						}
						return AcquireWritableStreamDefaultWriter(this);
					}
				}
				Object.defineProperties(WritableStream.prototype, {
					abort: { enumerable: true },
					close: { enumerable: true },
					getWriter: { enumerable: true },
					locked: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
						value: 'WritableStream',
						configurable: true
					});
				}
				function AcquireWritableStreamDefaultWriter(stream) {
					return new WritableStreamDefaultWriter(stream);
				}
				function CreateWritableStream(
					startAlgorithm,
					writeAlgorithm,
					closeAlgorithm,
					abortAlgorithm,
					highWaterMark = 1,
					sizeAlgorithm = () => 1
				) {
					const stream = Object.create(WritableStream.prototype);
					InitializeWritableStream(stream);
					const controller = Object.create(WritableStreamDefaultController.prototype);
					SetUpWritableStreamDefaultController(
						stream,
						controller,
						startAlgorithm,
						writeAlgorithm,
						closeAlgorithm,
						abortAlgorithm,
						highWaterMark,
						sizeAlgorithm
					);
					return stream;
				}
				function InitializeWritableStream(stream) {
					stream._state = 'writable';
					stream._storedError = void 0;
					stream._writer = void 0;
					stream._writableStreamController = void 0;
					stream._writeRequests = new SimpleQueue();
					stream._inFlightWriteRequest = void 0;
					stream._closeRequest = void 0;
					stream._inFlightCloseRequest = void 0;
					stream._pendingAbortRequest = void 0;
					stream._backpressure = false;
				}
				function IsWritableStream(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_writableStreamController')) {
						return false;
					}
					return x instanceof WritableStream;
				}
				function IsWritableStreamLocked(stream) {
					if (stream._writer === void 0) {
						return false;
					}
					return true;
				}
				function WritableStreamAbort(stream, reason) {
					var _a;
					if (stream._state === 'closed' || stream._state === 'errored') {
						return promiseResolvedWith(void 0);
					}
					stream._writableStreamController._abortReason = reason;
					(_a = stream._writableStreamController._abortController) === null || _a === void 0
						? void 0
						: _a.abort();
					const state = stream._state;
					if (state === 'closed' || state === 'errored') {
						return promiseResolvedWith(void 0);
					}
					if (stream._pendingAbortRequest !== void 0) {
						return stream._pendingAbortRequest._promise;
					}
					let wasAlreadyErroring = false;
					if (state === 'erroring') {
						wasAlreadyErroring = true;
						reason = void 0;
					}
					const promise = newPromise((resolve2, reject) => {
						stream._pendingAbortRequest = {
							_promise: void 0,
							_resolve: resolve2,
							_reject: reject,
							_reason: reason,
							_wasAlreadyErroring: wasAlreadyErroring
						};
					});
					stream._pendingAbortRequest._promise = promise;
					if (!wasAlreadyErroring) {
						WritableStreamStartErroring(stream, reason);
					}
					return promise;
				}
				function WritableStreamClose(stream) {
					const state = stream._state;
					if (state === 'closed' || state === 'errored') {
						return promiseRejectedWith(
							new TypeError(
								`The stream (in ${state} state) is not in the writable state and cannot be closed`
							)
						);
					}
					const promise = newPromise((resolve2, reject) => {
						const closeRequest = {
							_resolve: resolve2,
							_reject: reject
						};
						stream._closeRequest = closeRequest;
					});
					const writer = stream._writer;
					if (writer !== void 0 && stream._backpressure && state === 'writable') {
						defaultWriterReadyPromiseResolve(writer);
					}
					WritableStreamDefaultControllerClose(stream._writableStreamController);
					return promise;
				}
				function WritableStreamAddWriteRequest(stream) {
					const promise = newPromise((resolve2, reject) => {
						const writeRequest = {
							_resolve: resolve2,
							_reject: reject
						};
						stream._writeRequests.push(writeRequest);
					});
					return promise;
				}
				function WritableStreamDealWithRejection(stream, error2) {
					const state = stream._state;
					if (state === 'writable') {
						WritableStreamStartErroring(stream, error2);
						return;
					}
					WritableStreamFinishErroring(stream);
				}
				function WritableStreamStartErroring(stream, reason) {
					const controller = stream._writableStreamController;
					stream._state = 'erroring';
					stream._storedError = reason;
					const writer = stream._writer;
					if (writer !== void 0) {
						WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
					}
					if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
						WritableStreamFinishErroring(stream);
					}
				}
				function WritableStreamFinishErroring(stream) {
					stream._state = 'errored';
					stream._writableStreamController[ErrorSteps]();
					const storedError = stream._storedError;
					stream._writeRequests.forEach((writeRequest) => {
						writeRequest._reject(storedError);
					});
					stream._writeRequests = new SimpleQueue();
					if (stream._pendingAbortRequest === void 0) {
						WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
						return;
					}
					const abortRequest = stream._pendingAbortRequest;
					stream._pendingAbortRequest = void 0;
					if (abortRequest._wasAlreadyErroring) {
						abortRequest._reject(storedError);
						WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
						return;
					}
					const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
					uponPromise(
						promise,
						() => {
							abortRequest._resolve();
							WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
						},
						(reason) => {
							abortRequest._reject(reason);
							WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
						}
					);
				}
				function WritableStreamFinishInFlightWrite(stream) {
					stream._inFlightWriteRequest._resolve(void 0);
					stream._inFlightWriteRequest = void 0;
				}
				function WritableStreamFinishInFlightWriteWithError(stream, error2) {
					stream._inFlightWriteRequest._reject(error2);
					stream._inFlightWriteRequest = void 0;
					WritableStreamDealWithRejection(stream, error2);
				}
				function WritableStreamFinishInFlightClose(stream) {
					stream._inFlightCloseRequest._resolve(void 0);
					stream._inFlightCloseRequest = void 0;
					const state = stream._state;
					if (state === 'erroring') {
						stream._storedError = void 0;
						if (stream._pendingAbortRequest !== void 0) {
							stream._pendingAbortRequest._resolve();
							stream._pendingAbortRequest = void 0;
						}
					}
					stream._state = 'closed';
					const writer = stream._writer;
					if (writer !== void 0) {
						defaultWriterClosedPromiseResolve(writer);
					}
				}
				function WritableStreamFinishInFlightCloseWithError(stream, error2) {
					stream._inFlightCloseRequest._reject(error2);
					stream._inFlightCloseRequest = void 0;
					if (stream._pendingAbortRequest !== void 0) {
						stream._pendingAbortRequest._reject(error2);
						stream._pendingAbortRequest = void 0;
					}
					WritableStreamDealWithRejection(stream, error2);
				}
				function WritableStreamCloseQueuedOrInFlight(stream) {
					if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
						return false;
					}
					return true;
				}
				function WritableStreamHasOperationMarkedInFlight(stream) {
					if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
						return false;
					}
					return true;
				}
				function WritableStreamMarkCloseRequestInFlight(stream) {
					stream._inFlightCloseRequest = stream._closeRequest;
					stream._closeRequest = void 0;
				}
				function WritableStreamMarkFirstWriteRequestInFlight(stream) {
					stream._inFlightWriteRequest = stream._writeRequests.shift();
				}
				function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
					if (stream._closeRequest !== void 0) {
						stream._closeRequest._reject(stream._storedError);
						stream._closeRequest = void 0;
					}
					const writer = stream._writer;
					if (writer !== void 0) {
						defaultWriterClosedPromiseReject(writer, stream._storedError);
					}
				}
				function WritableStreamUpdateBackpressure(stream, backpressure) {
					const writer = stream._writer;
					if (writer !== void 0 && backpressure !== stream._backpressure) {
						if (backpressure) {
							defaultWriterReadyPromiseReset(writer);
						} else {
							defaultWriterReadyPromiseResolve(writer);
						}
					}
					stream._backpressure = backpressure;
				}
				class WritableStreamDefaultWriter {
					constructor(stream) {
						assertRequiredArgument(stream, 1, 'WritableStreamDefaultWriter');
						assertWritableStream(stream, 'First parameter');
						if (IsWritableStreamLocked(stream)) {
							throw new TypeError(
								'This stream has already been locked for exclusive writing by another writer'
							);
						}
						this._ownerWritableStream = stream;
						stream._writer = this;
						const state = stream._state;
						if (state === 'writable') {
							if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
								defaultWriterReadyPromiseInitialize(this);
							} else {
								defaultWriterReadyPromiseInitializeAsResolved(this);
							}
							defaultWriterClosedPromiseInitialize(this);
						} else if (state === 'erroring') {
							defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
							defaultWriterClosedPromiseInitialize(this);
						} else if (state === 'closed') {
							defaultWriterReadyPromiseInitializeAsResolved(this);
							defaultWriterClosedPromiseInitializeAsResolved(this);
						} else {
							const storedError = stream._storedError;
							defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
							defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
						}
					}
					get closed() {
						if (!IsWritableStreamDefaultWriter(this)) {
							return promiseRejectedWith(defaultWriterBrandCheckException('closed'));
						}
						return this._closedPromise;
					}
					get desiredSize() {
						if (!IsWritableStreamDefaultWriter(this)) {
							throw defaultWriterBrandCheckException('desiredSize');
						}
						if (this._ownerWritableStream === void 0) {
							throw defaultWriterLockException('desiredSize');
						}
						return WritableStreamDefaultWriterGetDesiredSize(this);
					}
					get ready() {
						if (!IsWritableStreamDefaultWriter(this)) {
							return promiseRejectedWith(defaultWriterBrandCheckException('ready'));
						}
						return this._readyPromise;
					}
					abort(reason = void 0) {
						if (!IsWritableStreamDefaultWriter(this)) {
							return promiseRejectedWith(defaultWriterBrandCheckException('abort'));
						}
						if (this._ownerWritableStream === void 0) {
							return promiseRejectedWith(defaultWriterLockException('abort'));
						}
						return WritableStreamDefaultWriterAbort(this, reason);
					}
					close() {
						if (!IsWritableStreamDefaultWriter(this)) {
							return promiseRejectedWith(defaultWriterBrandCheckException('close'));
						}
						const stream = this._ownerWritableStream;
						if (stream === void 0) {
							return promiseRejectedWith(defaultWriterLockException('close'));
						}
						if (WritableStreamCloseQueuedOrInFlight(stream)) {
							return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'));
						}
						return WritableStreamDefaultWriterClose(this);
					}
					releaseLock() {
						if (!IsWritableStreamDefaultWriter(this)) {
							throw defaultWriterBrandCheckException('releaseLock');
						}
						const stream = this._ownerWritableStream;
						if (stream === void 0) {
							return;
						}
						WritableStreamDefaultWriterRelease(this);
					}
					write(chunk = void 0) {
						if (!IsWritableStreamDefaultWriter(this)) {
							return promiseRejectedWith(defaultWriterBrandCheckException('write'));
						}
						if (this._ownerWritableStream === void 0) {
							return promiseRejectedWith(defaultWriterLockException('write to'));
						}
						return WritableStreamDefaultWriterWrite(this, chunk);
					}
				}
				Object.defineProperties(WritableStreamDefaultWriter.prototype, {
					abort: { enumerable: true },
					close: { enumerable: true },
					releaseLock: { enumerable: true },
					write: { enumerable: true },
					closed: { enumerable: true },
					desiredSize: { enumerable: true },
					ready: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
						value: 'WritableStreamDefaultWriter',
						configurable: true
					});
				}
				function IsWritableStreamDefaultWriter(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_ownerWritableStream')) {
						return false;
					}
					return x instanceof WritableStreamDefaultWriter;
				}
				function WritableStreamDefaultWriterAbort(writer, reason) {
					const stream = writer._ownerWritableStream;
					return WritableStreamAbort(stream, reason);
				}
				function WritableStreamDefaultWriterClose(writer) {
					const stream = writer._ownerWritableStream;
					return WritableStreamClose(stream);
				}
				function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
					const stream = writer._ownerWritableStream;
					const state = stream._state;
					if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
						return promiseResolvedWith(void 0);
					}
					if (state === 'errored') {
						return promiseRejectedWith(stream._storedError);
					}
					return WritableStreamDefaultWriterClose(writer);
				}
				function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error2) {
					if (writer._closedPromiseState === 'pending') {
						defaultWriterClosedPromiseReject(writer, error2);
					} else {
						defaultWriterClosedPromiseResetToRejected(writer, error2);
					}
				}
				function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error2) {
					if (writer._readyPromiseState === 'pending') {
						defaultWriterReadyPromiseReject(writer, error2);
					} else {
						defaultWriterReadyPromiseResetToRejected(writer, error2);
					}
				}
				function WritableStreamDefaultWriterGetDesiredSize(writer) {
					const stream = writer._ownerWritableStream;
					const state = stream._state;
					if (state === 'errored' || state === 'erroring') {
						return null;
					}
					if (state === 'closed') {
						return 0;
					}
					return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
				}
				function WritableStreamDefaultWriterRelease(writer) {
					const stream = writer._ownerWritableStream;
					const releasedError = new TypeError(
						`Writer was released and can no longer be used to monitor the stream's closedness`
					);
					WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
					WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
					stream._writer = void 0;
					writer._ownerWritableStream = void 0;
				}
				function WritableStreamDefaultWriterWrite(writer, chunk) {
					const stream = writer._ownerWritableStream;
					const controller = stream._writableStreamController;
					const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
					if (stream !== writer._ownerWritableStream) {
						return promiseRejectedWith(defaultWriterLockException('write to'));
					}
					const state = stream._state;
					if (state === 'errored') {
						return promiseRejectedWith(stream._storedError);
					}
					if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
						return promiseRejectedWith(
							new TypeError('The stream is closing or closed and cannot be written to')
						);
					}
					if (state === 'erroring') {
						return promiseRejectedWith(stream._storedError);
					}
					const promise = WritableStreamAddWriteRequest(stream);
					WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
					return promise;
				}
				const closeSentinel = {};
				class WritableStreamDefaultController {
					constructor() {
						throw new TypeError('Illegal constructor');
					}
					get abortReason() {
						if (!IsWritableStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException$2('abortReason');
						}
						return this._abortReason;
					}
					get signal() {
						if (!IsWritableStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException$2('signal');
						}
						if (this._abortController === void 0) {
							throw new TypeError(
								'WritableStreamDefaultController.prototype.signal is not supported'
							);
						}
						return this._abortController.signal;
					}
					error(e = void 0) {
						if (!IsWritableStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException$2('error');
						}
						const state = this._controlledWritableStream._state;
						if (state !== 'writable') {
							return;
						}
						WritableStreamDefaultControllerError(this, e);
					}
					[AbortSteps](reason) {
						const result = this._abortAlgorithm(reason);
						WritableStreamDefaultControllerClearAlgorithms(this);
						return result;
					}
					[ErrorSteps]() {
						ResetQueue(this);
					}
				}
				Object.defineProperties(WritableStreamDefaultController.prototype, {
					error: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(
						WritableStreamDefaultController.prototype,
						SymbolPolyfill.toStringTag,
						{
							value: 'WritableStreamDefaultController',
							configurable: true
						}
					);
				}
				function IsWritableStreamDefaultController(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_controlledWritableStream')) {
						return false;
					}
					return x instanceof WritableStreamDefaultController;
				}
				function SetUpWritableStreamDefaultController(
					stream,
					controller,
					startAlgorithm,
					writeAlgorithm,
					closeAlgorithm,
					abortAlgorithm,
					highWaterMark,
					sizeAlgorithm
				) {
					controller._controlledWritableStream = stream;
					stream._writableStreamController = controller;
					controller._queue = void 0;
					controller._queueTotalSize = void 0;
					ResetQueue(controller);
					controller._abortReason = void 0;
					controller._abortController = createAbortController();
					controller._started = false;
					controller._strategySizeAlgorithm = sizeAlgorithm;
					controller._strategyHWM = highWaterMark;
					controller._writeAlgorithm = writeAlgorithm;
					controller._closeAlgorithm = closeAlgorithm;
					controller._abortAlgorithm = abortAlgorithm;
					const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
					WritableStreamUpdateBackpressure(stream, backpressure);
					const startResult = startAlgorithm();
					const startPromise = promiseResolvedWith(startResult);
					uponPromise(
						startPromise,
						() => {
							controller._started = true;
							WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
						},
						(r) => {
							controller._started = true;
							WritableStreamDealWithRejection(stream, r);
						}
					);
				}
				function SetUpWritableStreamDefaultControllerFromUnderlyingSink(
					stream,
					underlyingSink,
					highWaterMark,
					sizeAlgorithm
				) {
					const controller = Object.create(WritableStreamDefaultController.prototype);
					let startAlgorithm = () => void 0;
					let writeAlgorithm = () => promiseResolvedWith(void 0);
					let closeAlgorithm = () => promiseResolvedWith(void 0);
					let abortAlgorithm = () => promiseResolvedWith(void 0);
					if (underlyingSink.start !== void 0) {
						startAlgorithm = () => underlyingSink.start(controller);
					}
					if (underlyingSink.write !== void 0) {
						writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
					}
					if (underlyingSink.close !== void 0) {
						closeAlgorithm = () => underlyingSink.close();
					}
					if (underlyingSink.abort !== void 0) {
						abortAlgorithm = (reason) => underlyingSink.abort(reason);
					}
					SetUpWritableStreamDefaultController(
						stream,
						controller,
						startAlgorithm,
						writeAlgorithm,
						closeAlgorithm,
						abortAlgorithm,
						highWaterMark,
						sizeAlgorithm
					);
				}
				function WritableStreamDefaultControllerClearAlgorithms(controller) {
					controller._writeAlgorithm = void 0;
					controller._closeAlgorithm = void 0;
					controller._abortAlgorithm = void 0;
					controller._strategySizeAlgorithm = void 0;
				}
				function WritableStreamDefaultControllerClose(controller) {
					EnqueueValueWithSize(controller, closeSentinel, 0);
					WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
				}
				function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
					try {
						return controller._strategySizeAlgorithm(chunk);
					} catch (chunkSizeE) {
						WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
						return 1;
					}
				}
				function WritableStreamDefaultControllerGetDesiredSize(controller) {
					return controller._strategyHWM - controller._queueTotalSize;
				}
				function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
					try {
						EnqueueValueWithSize(controller, chunk, chunkSize);
					} catch (enqueueE) {
						WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
						return;
					}
					const stream = controller._controlledWritableStream;
					if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === 'writable') {
						const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
						WritableStreamUpdateBackpressure(stream, backpressure);
					}
					WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
				}
				function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
					const stream = controller._controlledWritableStream;
					if (!controller._started) {
						return;
					}
					if (stream._inFlightWriteRequest !== void 0) {
						return;
					}
					const state = stream._state;
					if (state === 'erroring') {
						WritableStreamFinishErroring(stream);
						return;
					}
					if (controller._queue.length === 0) {
						return;
					}
					const value = PeekQueueValue(controller);
					if (value === closeSentinel) {
						WritableStreamDefaultControllerProcessClose(controller);
					} else {
						WritableStreamDefaultControllerProcessWrite(controller, value);
					}
				}
				function WritableStreamDefaultControllerErrorIfNeeded(controller, error2) {
					if (controller._controlledWritableStream._state === 'writable') {
						WritableStreamDefaultControllerError(controller, error2);
					}
				}
				function WritableStreamDefaultControllerProcessClose(controller) {
					const stream = controller._controlledWritableStream;
					WritableStreamMarkCloseRequestInFlight(stream);
					DequeueValue(controller);
					const sinkClosePromise = controller._closeAlgorithm();
					WritableStreamDefaultControllerClearAlgorithms(controller);
					uponPromise(
						sinkClosePromise,
						() => {
							WritableStreamFinishInFlightClose(stream);
						},
						(reason) => {
							WritableStreamFinishInFlightCloseWithError(stream, reason);
						}
					);
				}
				function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
					const stream = controller._controlledWritableStream;
					WritableStreamMarkFirstWriteRequestInFlight(stream);
					const sinkWritePromise = controller._writeAlgorithm(chunk);
					uponPromise(
						sinkWritePromise,
						() => {
							WritableStreamFinishInFlightWrite(stream);
							const state = stream._state;
							DequeueValue(controller);
							if (!WritableStreamCloseQueuedOrInFlight(stream) && state === 'writable') {
								const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
								WritableStreamUpdateBackpressure(stream, backpressure);
							}
							WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
						},
						(reason) => {
							if (stream._state === 'writable') {
								WritableStreamDefaultControllerClearAlgorithms(controller);
							}
							WritableStreamFinishInFlightWriteWithError(stream, reason);
						}
					);
				}
				function WritableStreamDefaultControllerGetBackpressure(controller) {
					const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
					return desiredSize <= 0;
				}
				function WritableStreamDefaultControllerError(controller, error2) {
					const stream = controller._controlledWritableStream;
					WritableStreamDefaultControllerClearAlgorithms(controller);
					WritableStreamStartErroring(stream, error2);
				}
				function streamBrandCheckException$2(name) {
					return new TypeError(
						`WritableStream.prototype.${name} can only be used on a WritableStream`
					);
				}
				function defaultControllerBrandCheckException$2(name) {
					return new TypeError(
						`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`
					);
				}
				function defaultWriterBrandCheckException(name) {
					return new TypeError(
						`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`
					);
				}
				function defaultWriterLockException(name) {
					return new TypeError('Cannot ' + name + ' a stream using a released writer');
				}
				function defaultWriterClosedPromiseInitialize(writer) {
					writer._closedPromise = newPromise((resolve2, reject) => {
						writer._closedPromise_resolve = resolve2;
						writer._closedPromise_reject = reject;
						writer._closedPromiseState = 'pending';
					});
				}
				function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
					defaultWriterClosedPromiseInitialize(writer);
					defaultWriterClosedPromiseReject(writer, reason);
				}
				function defaultWriterClosedPromiseInitializeAsResolved(writer) {
					defaultWriterClosedPromiseInitialize(writer);
					defaultWriterClosedPromiseResolve(writer);
				}
				function defaultWriterClosedPromiseReject(writer, reason) {
					if (writer._closedPromise_reject === void 0) {
						return;
					}
					setPromiseIsHandledToTrue(writer._closedPromise);
					writer._closedPromise_reject(reason);
					writer._closedPromise_resolve = void 0;
					writer._closedPromise_reject = void 0;
					writer._closedPromiseState = 'rejected';
				}
				function defaultWriterClosedPromiseResetToRejected(writer, reason) {
					defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
				}
				function defaultWriterClosedPromiseResolve(writer) {
					if (writer._closedPromise_resolve === void 0) {
						return;
					}
					writer._closedPromise_resolve(void 0);
					writer._closedPromise_resolve = void 0;
					writer._closedPromise_reject = void 0;
					writer._closedPromiseState = 'resolved';
				}
				function defaultWriterReadyPromiseInitialize(writer) {
					writer._readyPromise = newPromise((resolve2, reject) => {
						writer._readyPromise_resolve = resolve2;
						writer._readyPromise_reject = reject;
					});
					writer._readyPromiseState = 'pending';
				}
				function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
					defaultWriterReadyPromiseInitialize(writer);
					defaultWriterReadyPromiseReject(writer, reason);
				}
				function defaultWriterReadyPromiseInitializeAsResolved(writer) {
					defaultWriterReadyPromiseInitialize(writer);
					defaultWriterReadyPromiseResolve(writer);
				}
				function defaultWriterReadyPromiseReject(writer, reason) {
					if (writer._readyPromise_reject === void 0) {
						return;
					}
					setPromiseIsHandledToTrue(writer._readyPromise);
					writer._readyPromise_reject(reason);
					writer._readyPromise_resolve = void 0;
					writer._readyPromise_reject = void 0;
					writer._readyPromiseState = 'rejected';
				}
				function defaultWriterReadyPromiseReset(writer) {
					defaultWriterReadyPromiseInitialize(writer);
				}
				function defaultWriterReadyPromiseResetToRejected(writer, reason) {
					defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
				}
				function defaultWriterReadyPromiseResolve(writer) {
					if (writer._readyPromise_resolve === void 0) {
						return;
					}
					writer._readyPromise_resolve(void 0);
					writer._readyPromise_resolve = void 0;
					writer._readyPromise_reject = void 0;
					writer._readyPromiseState = 'fulfilled';
				}
				const NativeDOMException = typeof DOMException !== 'undefined' ? DOMException : void 0;
				function isDOMExceptionConstructor(ctor) {
					if (!(typeof ctor === 'function' || typeof ctor === 'object')) {
						return false;
					}
					try {
						new ctor();
						return true;
					} catch (_a) {
						return false;
					}
				}
				function createDOMExceptionPolyfill() {
					const ctor = function DOMException2(message, name) {
						this.message = message || '';
						this.name = name || 'Error';
						if (Error.captureStackTrace) {
							Error.captureStackTrace(this, this.constructor);
						}
					};
					ctor.prototype = Object.create(Error.prototype);
					Object.defineProperty(ctor.prototype, 'constructor', {
						value: ctor,
						writable: true,
						configurable: true
					});
					return ctor;
				}
				const DOMException$1 = isDOMExceptionConstructor(NativeDOMException)
					? NativeDOMException
					: createDOMExceptionPolyfill();
				function ReadableStreamPipeTo(
					source,
					dest,
					preventClose,
					preventAbort,
					preventCancel,
					signal
				) {
					const reader = AcquireReadableStreamDefaultReader(source);
					const writer = AcquireWritableStreamDefaultWriter(dest);
					source._disturbed = true;
					let shuttingDown = false;
					let currentWrite = promiseResolvedWith(void 0);
					return newPromise((resolve2, reject) => {
						let abortAlgorithm;
						if (signal !== void 0) {
							abortAlgorithm = () => {
								const error2 = new DOMException$1('Aborted', 'AbortError');
								const actions = [];
								if (!preventAbort) {
									actions.push(() => {
										if (dest._state === 'writable') {
											return WritableStreamAbort(dest, error2);
										}
										return promiseResolvedWith(void 0);
									});
								}
								if (!preventCancel) {
									actions.push(() => {
										if (source._state === 'readable') {
											return ReadableStreamCancel(source, error2);
										}
										return promiseResolvedWith(void 0);
									});
								}
								shutdownWithAction(
									() => Promise.all(actions.map((action) => action())),
									true,
									error2
								);
							};
							if (signal.aborted) {
								abortAlgorithm();
								return;
							}
							signal.addEventListener('abort', abortAlgorithm);
						}
						function pipeLoop() {
							return newPromise((resolveLoop, rejectLoop) => {
								function next(done) {
									if (done) {
										resolveLoop();
									} else {
										PerformPromiseThen(pipeStep(), next, rejectLoop);
									}
								}
								next(false);
							});
						}
						function pipeStep() {
							if (shuttingDown) {
								return promiseResolvedWith(true);
							}
							return PerformPromiseThen(writer._readyPromise, () => {
								return newPromise((resolveRead, rejectRead) => {
									ReadableStreamDefaultReaderRead(reader, {
										_chunkSteps: (chunk) => {
											currentWrite = PerformPromiseThen(
												WritableStreamDefaultWriterWrite(writer, chunk),
												void 0,
												noop2
											);
											resolveRead(false);
										},
										_closeSteps: () => resolveRead(true),
										_errorSteps: rejectRead
									});
								});
							});
						}
						isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
							if (!preventAbort) {
								shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
							} else {
								shutdown(true, storedError);
							}
						});
						isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
							if (!preventCancel) {
								shutdownWithAction(
									() => ReadableStreamCancel(source, storedError),
									true,
									storedError
								);
							} else {
								shutdown(true, storedError);
							}
						});
						isOrBecomesClosed(source, reader._closedPromise, () => {
							if (!preventClose) {
								shutdownWithAction(() =>
									WritableStreamDefaultWriterCloseWithErrorPropagation(writer)
								);
							} else {
								shutdown();
							}
						});
						if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === 'closed') {
							const destClosed = new TypeError(
								'the destination writable stream closed before all data could be piped to it'
							);
							if (!preventCancel) {
								shutdownWithAction(
									() => ReadableStreamCancel(source, destClosed),
									true,
									destClosed
								);
							} else {
								shutdown(true, destClosed);
							}
						}
						setPromiseIsHandledToTrue(pipeLoop());
						function waitForWritesToFinish() {
							const oldCurrentWrite = currentWrite;
							return PerformPromiseThen(currentWrite, () =>
								oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0
							);
						}
						function isOrBecomesErrored(stream, promise, action) {
							if (stream._state === 'errored') {
								action(stream._storedError);
							} else {
								uponRejection(promise, action);
							}
						}
						function isOrBecomesClosed(stream, promise, action) {
							if (stream._state === 'closed') {
								action();
							} else {
								uponFulfillment(promise, action);
							}
						}
						function shutdownWithAction(action, originalIsError, originalError) {
							if (shuttingDown) {
								return;
							}
							shuttingDown = true;
							if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
								uponFulfillment(waitForWritesToFinish(), doTheRest);
							} else {
								doTheRest();
							}
							function doTheRest() {
								uponPromise(
									action(),
									() => finalize(originalIsError, originalError),
									(newError) => finalize(true, newError)
								);
							}
						}
						function shutdown(isError, error2) {
							if (shuttingDown) {
								return;
							}
							shuttingDown = true;
							if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
								uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error2));
							} else {
								finalize(isError, error2);
							}
						}
						function finalize(isError, error2) {
							WritableStreamDefaultWriterRelease(writer);
							ReadableStreamReaderGenericRelease(reader);
							if (signal !== void 0) {
								signal.removeEventListener('abort', abortAlgorithm);
							}
							if (isError) {
								reject(error2);
							} else {
								resolve2(void 0);
							}
						}
					});
				}
				class ReadableStreamDefaultController {
					constructor() {
						throw new TypeError('Illegal constructor');
					}
					get desiredSize() {
						if (!IsReadableStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException$1('desiredSize');
						}
						return ReadableStreamDefaultControllerGetDesiredSize(this);
					}
					close() {
						if (!IsReadableStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException$1('close');
						}
						if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
							throw new TypeError('The stream is not in a state that permits close');
						}
						ReadableStreamDefaultControllerClose(this);
					}
					enqueue(chunk = void 0) {
						if (!IsReadableStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException$1('enqueue');
						}
						if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
							throw new TypeError('The stream is not in a state that permits enqueue');
						}
						return ReadableStreamDefaultControllerEnqueue(this, chunk);
					}
					error(e = void 0) {
						if (!IsReadableStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException$1('error');
						}
						ReadableStreamDefaultControllerError(this, e);
					}
					[CancelSteps](reason) {
						ResetQueue(this);
						const result = this._cancelAlgorithm(reason);
						ReadableStreamDefaultControllerClearAlgorithms(this);
						return result;
					}
					[PullSteps](readRequest) {
						const stream = this._controlledReadableStream;
						if (this._queue.length > 0) {
							const chunk = DequeueValue(this);
							if (this._closeRequested && this._queue.length === 0) {
								ReadableStreamDefaultControllerClearAlgorithms(this);
								ReadableStreamClose(stream);
							} else {
								ReadableStreamDefaultControllerCallPullIfNeeded(this);
							}
							readRequest._chunkSteps(chunk);
						} else {
							ReadableStreamAddReadRequest(stream, readRequest);
							ReadableStreamDefaultControllerCallPullIfNeeded(this);
						}
					}
				}
				Object.defineProperties(ReadableStreamDefaultController.prototype, {
					close: { enumerable: true },
					enqueue: { enumerable: true },
					error: { enumerable: true },
					desiredSize: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(
						ReadableStreamDefaultController.prototype,
						SymbolPolyfill.toStringTag,
						{
							value: 'ReadableStreamDefaultController',
							configurable: true
						}
					);
				}
				function IsReadableStreamDefaultController(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_controlledReadableStream')) {
						return false;
					}
					return x instanceof ReadableStreamDefaultController;
				}
				function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
					const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
					if (!shouldPull) {
						return;
					}
					if (controller._pulling) {
						controller._pullAgain = true;
						return;
					}
					controller._pulling = true;
					const pullPromise = controller._pullAlgorithm();
					uponPromise(
						pullPromise,
						() => {
							controller._pulling = false;
							if (controller._pullAgain) {
								controller._pullAgain = false;
								ReadableStreamDefaultControllerCallPullIfNeeded(controller);
							}
						},
						(e) => {
							ReadableStreamDefaultControllerError(controller, e);
						}
					);
				}
				function ReadableStreamDefaultControllerShouldCallPull(controller) {
					const stream = controller._controlledReadableStream;
					if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
						return false;
					}
					if (!controller._started) {
						return false;
					}
					if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
						return true;
					}
					const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
					if (desiredSize > 0) {
						return true;
					}
					return false;
				}
				function ReadableStreamDefaultControllerClearAlgorithms(controller) {
					controller._pullAlgorithm = void 0;
					controller._cancelAlgorithm = void 0;
					controller._strategySizeAlgorithm = void 0;
				}
				function ReadableStreamDefaultControllerClose(controller) {
					if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
						return;
					}
					const stream = controller._controlledReadableStream;
					controller._closeRequested = true;
					if (controller._queue.length === 0) {
						ReadableStreamDefaultControllerClearAlgorithms(controller);
						ReadableStreamClose(stream);
					}
				}
				function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
					if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
						return;
					}
					const stream = controller._controlledReadableStream;
					if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
						ReadableStreamFulfillReadRequest(stream, chunk, false);
					} else {
						let chunkSize;
						try {
							chunkSize = controller._strategySizeAlgorithm(chunk);
						} catch (chunkSizeE) {
							ReadableStreamDefaultControllerError(controller, chunkSizeE);
							throw chunkSizeE;
						}
						try {
							EnqueueValueWithSize(controller, chunk, chunkSize);
						} catch (enqueueE) {
							ReadableStreamDefaultControllerError(controller, enqueueE);
							throw enqueueE;
						}
					}
					ReadableStreamDefaultControllerCallPullIfNeeded(controller);
				}
				function ReadableStreamDefaultControllerError(controller, e) {
					const stream = controller._controlledReadableStream;
					if (stream._state !== 'readable') {
						return;
					}
					ResetQueue(controller);
					ReadableStreamDefaultControllerClearAlgorithms(controller);
					ReadableStreamError(stream, e);
				}
				function ReadableStreamDefaultControllerGetDesiredSize(controller) {
					const state = controller._controlledReadableStream._state;
					if (state === 'errored') {
						return null;
					}
					if (state === 'closed') {
						return 0;
					}
					return controller._strategyHWM - controller._queueTotalSize;
				}
				function ReadableStreamDefaultControllerHasBackpressure(controller) {
					if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
						return false;
					}
					return true;
				}
				function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
					const state = controller._controlledReadableStream._state;
					if (!controller._closeRequested && state === 'readable') {
						return true;
					}
					return false;
				}
				function SetUpReadableStreamDefaultController(
					stream,
					controller,
					startAlgorithm,
					pullAlgorithm,
					cancelAlgorithm,
					highWaterMark,
					sizeAlgorithm
				) {
					controller._controlledReadableStream = stream;
					controller._queue = void 0;
					controller._queueTotalSize = void 0;
					ResetQueue(controller);
					controller._started = false;
					controller._closeRequested = false;
					controller._pullAgain = false;
					controller._pulling = false;
					controller._strategySizeAlgorithm = sizeAlgorithm;
					controller._strategyHWM = highWaterMark;
					controller._pullAlgorithm = pullAlgorithm;
					controller._cancelAlgorithm = cancelAlgorithm;
					stream._readableStreamController = controller;
					const startResult = startAlgorithm();
					uponPromise(
						promiseResolvedWith(startResult),
						() => {
							controller._started = true;
							ReadableStreamDefaultControllerCallPullIfNeeded(controller);
						},
						(r) => {
							ReadableStreamDefaultControllerError(controller, r);
						}
					);
				}
				function SetUpReadableStreamDefaultControllerFromUnderlyingSource(
					stream,
					underlyingSource,
					highWaterMark,
					sizeAlgorithm
				) {
					const controller = Object.create(ReadableStreamDefaultController.prototype);
					let startAlgorithm = () => void 0;
					let pullAlgorithm = () => promiseResolvedWith(void 0);
					let cancelAlgorithm = () => promiseResolvedWith(void 0);
					if (underlyingSource.start !== void 0) {
						startAlgorithm = () => underlyingSource.start(controller);
					}
					if (underlyingSource.pull !== void 0) {
						pullAlgorithm = () => underlyingSource.pull(controller);
					}
					if (underlyingSource.cancel !== void 0) {
						cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
					}
					SetUpReadableStreamDefaultController(
						stream,
						controller,
						startAlgorithm,
						pullAlgorithm,
						cancelAlgorithm,
						highWaterMark,
						sizeAlgorithm
					);
				}
				function defaultControllerBrandCheckException$1(name) {
					return new TypeError(
						`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`
					);
				}
				function ReadableStreamTee(stream, cloneForBranch2) {
					if (IsReadableByteStreamController(stream._readableStreamController)) {
						return ReadableByteStreamTee(stream);
					}
					return ReadableStreamDefaultTee(stream);
				}
				function ReadableStreamDefaultTee(stream, cloneForBranch2) {
					const reader = AcquireReadableStreamDefaultReader(stream);
					let reading = false;
					let canceled1 = false;
					let canceled2 = false;
					let reason1;
					let reason2;
					let branch1;
					let branch2;
					let resolveCancelPromise;
					const cancelPromise = newPromise((resolve2) => {
						resolveCancelPromise = resolve2;
					});
					function pullAlgorithm() {
						if (reading) {
							return promiseResolvedWith(void 0);
						}
						reading = true;
						const readRequest = {
							_chunkSteps: (chunk) => {
								queueMicrotask(() => {
									reading = false;
									const chunk1 = chunk;
									const chunk2 = chunk;
									if (!canceled1) {
										ReadableStreamDefaultControllerEnqueue(
											branch1._readableStreamController,
											chunk1
										);
									}
									if (!canceled2) {
										ReadableStreamDefaultControllerEnqueue(
											branch2._readableStreamController,
											chunk2
										);
									}
								});
							},
							_closeSteps: () => {
								reading = false;
								if (!canceled1) {
									ReadableStreamDefaultControllerClose(branch1._readableStreamController);
								}
								if (!canceled2) {
									ReadableStreamDefaultControllerClose(branch2._readableStreamController);
								}
								if (!canceled1 || !canceled2) {
									resolveCancelPromise(void 0);
								}
							},
							_errorSteps: () => {
								reading = false;
							}
						};
						ReadableStreamDefaultReaderRead(reader, readRequest);
						return promiseResolvedWith(void 0);
					}
					function cancel1Algorithm(reason) {
						canceled1 = true;
						reason1 = reason;
						if (canceled2) {
							const compositeReason = CreateArrayFromList([reason1, reason2]);
							const cancelResult = ReadableStreamCancel(stream, compositeReason);
							resolveCancelPromise(cancelResult);
						}
						return cancelPromise;
					}
					function cancel2Algorithm(reason) {
						canceled2 = true;
						reason2 = reason;
						if (canceled1) {
							const compositeReason = CreateArrayFromList([reason1, reason2]);
							const cancelResult = ReadableStreamCancel(stream, compositeReason);
							resolveCancelPromise(cancelResult);
						}
						return cancelPromise;
					}
					function startAlgorithm() {}
					branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
					branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
					uponRejection(reader._closedPromise, (r) => {
						ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
						ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
						if (!canceled1 || !canceled2) {
							resolveCancelPromise(void 0);
						}
					});
					return [branch1, branch2];
				}
				function ReadableByteStreamTee(stream) {
					let reader = AcquireReadableStreamDefaultReader(stream);
					let reading = false;
					let canceled1 = false;
					let canceled2 = false;
					let reason1;
					let reason2;
					let branch1;
					let branch2;
					let resolveCancelPromise;
					const cancelPromise = newPromise((resolve2) => {
						resolveCancelPromise = resolve2;
					});
					function forwardReaderError(thisReader) {
						uponRejection(thisReader._closedPromise, (r) => {
							if (thisReader !== reader) {
								return;
							}
							ReadableByteStreamControllerError(branch1._readableStreamController, r);
							ReadableByteStreamControllerError(branch2._readableStreamController, r);
							if (!canceled1 || !canceled2) {
								resolveCancelPromise(void 0);
							}
						});
					}
					function pullWithDefaultReader() {
						if (IsReadableStreamBYOBReader(reader)) {
							ReadableStreamReaderGenericRelease(reader);
							reader = AcquireReadableStreamDefaultReader(stream);
							forwardReaderError(reader);
						}
						const readRequest = {
							_chunkSteps: (chunk) => {
								queueMicrotask(() => {
									reading = false;
									const chunk1 = chunk;
									let chunk2 = chunk;
									if (!canceled1 && !canceled2) {
										try {
											chunk2 = CloneAsUint8Array(chunk);
										} catch (cloneE) {
											ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
											ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
											resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
											return;
										}
									}
									if (!canceled1) {
										ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
									}
									if (!canceled2) {
										ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
									}
								});
							},
							_closeSteps: () => {
								reading = false;
								if (!canceled1) {
									ReadableByteStreamControllerClose(branch1._readableStreamController);
								}
								if (!canceled2) {
									ReadableByteStreamControllerClose(branch2._readableStreamController);
								}
								if (branch1._readableStreamController._pendingPullIntos.length > 0) {
									ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
								}
								if (branch2._readableStreamController._pendingPullIntos.length > 0) {
									ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
								}
								if (!canceled1 || !canceled2) {
									resolveCancelPromise(void 0);
								}
							},
							_errorSteps: () => {
								reading = false;
							}
						};
						ReadableStreamDefaultReaderRead(reader, readRequest);
					}
					function pullWithBYOBReader(view, forBranch2) {
						if (IsReadableStreamDefaultReader(reader)) {
							ReadableStreamReaderGenericRelease(reader);
							reader = AcquireReadableStreamBYOBReader(stream);
							forwardReaderError(reader);
						}
						const byobBranch = forBranch2 ? branch2 : branch1;
						const otherBranch = forBranch2 ? branch1 : branch2;
						const readIntoRequest = {
							_chunkSteps: (chunk) => {
								queueMicrotask(() => {
									reading = false;
									const byobCanceled = forBranch2 ? canceled2 : canceled1;
									const otherCanceled = forBranch2 ? canceled1 : canceled2;
									if (!otherCanceled) {
										let clonedChunk;
										try {
											clonedChunk = CloneAsUint8Array(chunk);
										} catch (cloneE) {
											ReadableByteStreamControllerError(
												byobBranch._readableStreamController,
												cloneE
											);
											ReadableByteStreamControllerError(
												otherBranch._readableStreamController,
												cloneE
											);
											resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
											return;
										}
										if (!byobCanceled) {
											ReadableByteStreamControllerRespondWithNewView(
												byobBranch._readableStreamController,
												chunk
											);
										}
										ReadableByteStreamControllerEnqueue(
											otherBranch._readableStreamController,
											clonedChunk
										);
									} else if (!byobCanceled) {
										ReadableByteStreamControllerRespondWithNewView(
											byobBranch._readableStreamController,
											chunk
										);
									}
								});
							},
							_closeSteps: (chunk) => {
								reading = false;
								const byobCanceled = forBranch2 ? canceled2 : canceled1;
								const otherCanceled = forBranch2 ? canceled1 : canceled2;
								if (!byobCanceled) {
									ReadableByteStreamControllerClose(byobBranch._readableStreamController);
								}
								if (!otherCanceled) {
									ReadableByteStreamControllerClose(otherBranch._readableStreamController);
								}
								if (chunk !== void 0) {
									if (!byobCanceled) {
										ReadableByteStreamControllerRespondWithNewView(
											byobBranch._readableStreamController,
											chunk
										);
									}
									if (
										!otherCanceled &&
										otherBranch._readableStreamController._pendingPullIntos.length > 0
									) {
										ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
									}
								}
								if (!byobCanceled || !otherCanceled) {
									resolveCancelPromise(void 0);
								}
							},
							_errorSteps: () => {
								reading = false;
							}
						};
						ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
					}
					function pull1Algorithm() {
						if (reading) {
							return promiseResolvedWith(void 0);
						}
						reading = true;
						const byobRequest = ReadableByteStreamControllerGetBYOBRequest(
							branch1._readableStreamController
						);
						if (byobRequest === null) {
							pullWithDefaultReader();
						} else {
							pullWithBYOBReader(byobRequest._view, false);
						}
						return promiseResolvedWith(void 0);
					}
					function pull2Algorithm() {
						if (reading) {
							return promiseResolvedWith(void 0);
						}
						reading = true;
						const byobRequest = ReadableByteStreamControllerGetBYOBRequest(
							branch2._readableStreamController
						);
						if (byobRequest === null) {
							pullWithDefaultReader();
						} else {
							pullWithBYOBReader(byobRequest._view, true);
						}
						return promiseResolvedWith(void 0);
					}
					function cancel1Algorithm(reason) {
						canceled1 = true;
						reason1 = reason;
						if (canceled2) {
							const compositeReason = CreateArrayFromList([reason1, reason2]);
							const cancelResult = ReadableStreamCancel(stream, compositeReason);
							resolveCancelPromise(cancelResult);
						}
						return cancelPromise;
					}
					function cancel2Algorithm(reason) {
						canceled2 = true;
						reason2 = reason;
						if (canceled1) {
							const compositeReason = CreateArrayFromList([reason1, reason2]);
							const cancelResult = ReadableStreamCancel(stream, compositeReason);
							resolveCancelPromise(cancelResult);
						}
						return cancelPromise;
					}
					function startAlgorithm() {
						return;
					}
					branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
					branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
					forwardReaderError(reader);
					return [branch1, branch2];
				}
				function convertUnderlyingDefaultOrByteSource(source, context) {
					assertDictionary(source, context);
					const original = source;
					const autoAllocateChunkSize =
						original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
					const cancel = original === null || original === void 0 ? void 0 : original.cancel;
					const pull = original === null || original === void 0 ? void 0 : original.pull;
					const start = original === null || original === void 0 ? void 0 : original.start;
					const type = original === null || original === void 0 ? void 0 : original.type;
					return {
						autoAllocateChunkSize:
							autoAllocateChunkSize === void 0
								? void 0
								: convertUnsignedLongLongWithEnforceRange(
										autoAllocateChunkSize,
										`${context} has member 'autoAllocateChunkSize' that`
								  ),
						cancel:
							cancel === void 0
								? void 0
								: convertUnderlyingSourceCancelCallback(
										cancel,
										original,
										`${context} has member 'cancel' that`
								  ),
						pull:
							pull === void 0
								? void 0
								: convertUnderlyingSourcePullCallback(
										pull,
										original,
										`${context} has member 'pull' that`
								  ),
						start:
							start === void 0
								? void 0
								: convertUnderlyingSourceStartCallback(
										start,
										original,
										`${context} has member 'start' that`
								  ),
						type:
							type === void 0
								? void 0
								: convertReadableStreamType(type, `${context} has member 'type' that`)
					};
				}
				function convertUnderlyingSourceCancelCallback(fn, original, context) {
					assertFunction(fn, context);
					return (reason) => promiseCall(fn, original, [reason]);
				}
				function convertUnderlyingSourcePullCallback(fn, original, context) {
					assertFunction(fn, context);
					return (controller) => promiseCall(fn, original, [controller]);
				}
				function convertUnderlyingSourceStartCallback(fn, original, context) {
					assertFunction(fn, context);
					return (controller) => reflectCall(fn, original, [controller]);
				}
				function convertReadableStreamType(type, context) {
					type = `${type}`;
					if (type !== 'bytes') {
						throw new TypeError(
							`${context} '${type}' is not a valid enumeration value for ReadableStreamType`
						);
					}
					return type;
				}
				function convertReaderOptions(options2, context) {
					assertDictionary(options2, context);
					const mode = options2 === null || options2 === void 0 ? void 0 : options2.mode;
					return {
						mode:
							mode === void 0
								? void 0
								: convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
					};
				}
				function convertReadableStreamReaderMode(mode, context) {
					mode = `${mode}`;
					if (mode !== 'byob') {
						throw new TypeError(
							`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`
						);
					}
					return mode;
				}
				function convertIteratorOptions(options2, context) {
					assertDictionary(options2, context);
					const preventCancel =
						options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
					return { preventCancel: Boolean(preventCancel) };
				}
				function convertPipeOptions(options2, context) {
					assertDictionary(options2, context);
					const preventAbort =
						options2 === null || options2 === void 0 ? void 0 : options2.preventAbort;
					const preventCancel =
						options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
					const preventClose =
						options2 === null || options2 === void 0 ? void 0 : options2.preventClose;
					const signal = options2 === null || options2 === void 0 ? void 0 : options2.signal;
					if (signal !== void 0) {
						assertAbortSignal(signal, `${context} has member 'signal' that`);
					}
					return {
						preventAbort: Boolean(preventAbort),
						preventCancel: Boolean(preventCancel),
						preventClose: Boolean(preventClose),
						signal
					};
				}
				function assertAbortSignal(signal, context) {
					if (!isAbortSignal2(signal)) {
						throw new TypeError(`${context} is not an AbortSignal.`);
					}
				}
				function convertReadableWritablePair(pair, context) {
					assertDictionary(pair, context);
					const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
					assertRequiredField(readable, 'readable', 'ReadableWritablePair');
					assertReadableStream(readable, `${context} has member 'readable' that`);
					const writable2 = pair === null || pair === void 0 ? void 0 : pair.writable;
					assertRequiredField(writable2, 'writable', 'ReadableWritablePair');
					assertWritableStream(writable2, `${context} has member 'writable' that`);
					return { readable, writable: writable2 };
				}
				class ReadableStream2 {
					constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
						if (rawUnderlyingSource === void 0) {
							rawUnderlyingSource = null;
						} else {
							assertObject(rawUnderlyingSource, 'First parameter');
						}
						const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter');
						const underlyingSource = convertUnderlyingDefaultOrByteSource(
							rawUnderlyingSource,
							'First parameter'
						);
						InitializeReadableStream(this);
						if (underlyingSource.type === 'bytes') {
							if (strategy.size !== void 0) {
								throw new RangeError('The strategy for a byte stream cannot have a size function');
							}
							const highWaterMark = ExtractHighWaterMark(strategy, 0);
							SetUpReadableByteStreamControllerFromUnderlyingSource(
								this,
								underlyingSource,
								highWaterMark
							);
						} else {
							const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
							const highWaterMark = ExtractHighWaterMark(strategy, 1);
							SetUpReadableStreamDefaultControllerFromUnderlyingSource(
								this,
								underlyingSource,
								highWaterMark,
								sizeAlgorithm
							);
						}
					}
					get locked() {
						if (!IsReadableStream(this)) {
							throw streamBrandCheckException$1('locked');
						}
						return IsReadableStreamLocked(this);
					}
					cancel(reason = void 0) {
						if (!IsReadableStream(this)) {
							return promiseRejectedWith(streamBrandCheckException$1('cancel'));
						}
						if (IsReadableStreamLocked(this)) {
							return promiseRejectedWith(
								new TypeError('Cannot cancel a stream that already has a reader')
							);
						}
						return ReadableStreamCancel(this, reason);
					}
					getReader(rawOptions = void 0) {
						if (!IsReadableStream(this)) {
							throw streamBrandCheckException$1('getReader');
						}
						const options2 = convertReaderOptions(rawOptions, 'First parameter');
						if (options2.mode === void 0) {
							return AcquireReadableStreamDefaultReader(this);
						}
						return AcquireReadableStreamBYOBReader(this);
					}
					pipeThrough(rawTransform, rawOptions = {}) {
						if (!IsReadableStream(this)) {
							throw streamBrandCheckException$1('pipeThrough');
						}
						assertRequiredArgument(rawTransform, 1, 'pipeThrough');
						const transform = convertReadableWritablePair(rawTransform, 'First parameter');
						const options2 = convertPipeOptions(rawOptions, 'Second parameter');
						if (IsReadableStreamLocked(this)) {
							throw new TypeError(
								'ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream'
							);
						}
						if (IsWritableStreamLocked(transform.writable)) {
							throw new TypeError(
								'ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream'
							);
						}
						const promise = ReadableStreamPipeTo(
							this,
							transform.writable,
							options2.preventClose,
							options2.preventAbort,
							options2.preventCancel,
							options2.signal
						);
						setPromiseIsHandledToTrue(promise);
						return transform.readable;
					}
					pipeTo(destination, rawOptions = {}) {
						if (!IsReadableStream(this)) {
							return promiseRejectedWith(streamBrandCheckException$1('pipeTo'));
						}
						if (destination === void 0) {
							return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
						}
						if (!IsWritableStream(destination)) {
							return promiseRejectedWith(
								new TypeError(
									`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`
								)
							);
						}
						let options2;
						try {
							options2 = convertPipeOptions(rawOptions, 'Second parameter');
						} catch (e) {
							return promiseRejectedWith(e);
						}
						if (IsReadableStreamLocked(this)) {
							return promiseRejectedWith(
								new TypeError(
									'ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream'
								)
							);
						}
						if (IsWritableStreamLocked(destination)) {
							return promiseRejectedWith(
								new TypeError(
									'ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream'
								)
							);
						}
						return ReadableStreamPipeTo(
							this,
							destination,
							options2.preventClose,
							options2.preventAbort,
							options2.preventCancel,
							options2.signal
						);
					}
					tee() {
						if (!IsReadableStream(this)) {
							throw streamBrandCheckException$1('tee');
						}
						const branches = ReadableStreamTee(this);
						return CreateArrayFromList(branches);
					}
					values(rawOptions = void 0) {
						if (!IsReadableStream(this)) {
							throw streamBrandCheckException$1('values');
						}
						const options2 = convertIteratorOptions(rawOptions, 'First parameter');
						return AcquireReadableStreamAsyncIterator(this, options2.preventCancel);
					}
				}
				Object.defineProperties(ReadableStream2.prototype, {
					cancel: { enumerable: true },
					getReader: { enumerable: true },
					pipeThrough: { enumerable: true },
					pipeTo: { enumerable: true },
					tee: { enumerable: true },
					values: { enumerable: true },
					locked: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
						value: 'ReadableStream',
						configurable: true
					});
				}
				if (typeof SymbolPolyfill.asyncIterator === 'symbol') {
					Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
						value: ReadableStream2.prototype.values,
						writable: true,
						configurable: true
					});
				}
				function CreateReadableStream(
					startAlgorithm,
					pullAlgorithm,
					cancelAlgorithm,
					highWaterMark = 1,
					sizeAlgorithm = () => 1
				) {
					const stream = Object.create(ReadableStream2.prototype);
					InitializeReadableStream(stream);
					const controller = Object.create(ReadableStreamDefaultController.prototype);
					SetUpReadableStreamDefaultController(
						stream,
						controller,
						startAlgorithm,
						pullAlgorithm,
						cancelAlgorithm,
						highWaterMark,
						sizeAlgorithm
					);
					return stream;
				}
				function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
					const stream = Object.create(ReadableStream2.prototype);
					InitializeReadableStream(stream);
					const controller = Object.create(ReadableByteStreamController.prototype);
					SetUpReadableByteStreamController(
						stream,
						controller,
						startAlgorithm,
						pullAlgorithm,
						cancelAlgorithm,
						0,
						void 0
					);
					return stream;
				}
				function InitializeReadableStream(stream) {
					stream._state = 'readable';
					stream._reader = void 0;
					stream._storedError = void 0;
					stream._disturbed = false;
				}
				function IsReadableStream(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_readableStreamController')) {
						return false;
					}
					return x instanceof ReadableStream2;
				}
				function IsReadableStreamLocked(stream) {
					if (stream._reader === void 0) {
						return false;
					}
					return true;
				}
				function ReadableStreamCancel(stream, reason) {
					stream._disturbed = true;
					if (stream._state === 'closed') {
						return promiseResolvedWith(void 0);
					}
					if (stream._state === 'errored') {
						return promiseRejectedWith(stream._storedError);
					}
					ReadableStreamClose(stream);
					const reader = stream._reader;
					if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
						reader._readIntoRequests.forEach((readIntoRequest) => {
							readIntoRequest._closeSteps(void 0);
						});
						reader._readIntoRequests = new SimpleQueue();
					}
					const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
					return transformPromiseWith(sourceCancelPromise, noop2);
				}
				function ReadableStreamClose(stream) {
					stream._state = 'closed';
					const reader = stream._reader;
					if (reader === void 0) {
						return;
					}
					defaultReaderClosedPromiseResolve(reader);
					if (IsReadableStreamDefaultReader(reader)) {
						reader._readRequests.forEach((readRequest) => {
							readRequest._closeSteps();
						});
						reader._readRequests = new SimpleQueue();
					}
				}
				function ReadableStreamError(stream, e) {
					stream._state = 'errored';
					stream._storedError = e;
					const reader = stream._reader;
					if (reader === void 0) {
						return;
					}
					defaultReaderClosedPromiseReject(reader, e);
					if (IsReadableStreamDefaultReader(reader)) {
						reader._readRequests.forEach((readRequest) => {
							readRequest._errorSteps(e);
						});
						reader._readRequests = new SimpleQueue();
					} else {
						reader._readIntoRequests.forEach((readIntoRequest) => {
							readIntoRequest._errorSteps(e);
						});
						reader._readIntoRequests = new SimpleQueue();
					}
				}
				function streamBrandCheckException$1(name) {
					return new TypeError(
						`ReadableStream.prototype.${name} can only be used on a ReadableStream`
					);
				}
				function convertQueuingStrategyInit(init2, context) {
					assertDictionary(init2, context);
					const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
					assertRequiredField(highWaterMark, 'highWaterMark', 'QueuingStrategyInit');
					return {
						highWaterMark: convertUnrestrictedDouble(highWaterMark)
					};
				}
				const byteLengthSizeFunction = (chunk) => {
					return chunk.byteLength;
				};
				Object.defineProperty(byteLengthSizeFunction, 'name', {
					value: 'size',
					configurable: true
				});
				class ByteLengthQueuingStrategy {
					constructor(options2) {
						assertRequiredArgument(options2, 1, 'ByteLengthQueuingStrategy');
						options2 = convertQueuingStrategyInit(options2, 'First parameter');
						this._byteLengthQueuingStrategyHighWaterMark = options2.highWaterMark;
					}
					get highWaterMark() {
						if (!IsByteLengthQueuingStrategy(this)) {
							throw byteLengthBrandCheckException('highWaterMark');
						}
						return this._byteLengthQueuingStrategyHighWaterMark;
					}
					get size() {
						if (!IsByteLengthQueuingStrategy(this)) {
							throw byteLengthBrandCheckException('size');
						}
						return byteLengthSizeFunction;
					}
				}
				Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
					highWaterMark: { enumerable: true },
					size: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
						value: 'ByteLengthQueuingStrategy',
						configurable: true
					});
				}
				function byteLengthBrandCheckException(name) {
					return new TypeError(
						`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`
					);
				}
				function IsByteLengthQueuingStrategy(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_byteLengthQueuingStrategyHighWaterMark')) {
						return false;
					}
					return x instanceof ByteLengthQueuingStrategy;
				}
				const countSizeFunction = () => {
					return 1;
				};
				Object.defineProperty(countSizeFunction, 'name', {
					value: 'size',
					configurable: true
				});
				class CountQueuingStrategy {
					constructor(options2) {
						assertRequiredArgument(options2, 1, 'CountQueuingStrategy');
						options2 = convertQueuingStrategyInit(options2, 'First parameter');
						this._countQueuingStrategyHighWaterMark = options2.highWaterMark;
					}
					get highWaterMark() {
						if (!IsCountQueuingStrategy(this)) {
							throw countBrandCheckException('highWaterMark');
						}
						return this._countQueuingStrategyHighWaterMark;
					}
					get size() {
						if (!IsCountQueuingStrategy(this)) {
							throw countBrandCheckException('size');
						}
						return countSizeFunction;
					}
				}
				Object.defineProperties(CountQueuingStrategy.prototype, {
					highWaterMark: { enumerable: true },
					size: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
						value: 'CountQueuingStrategy',
						configurable: true
					});
				}
				function countBrandCheckException(name) {
					return new TypeError(
						`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`
					);
				}
				function IsCountQueuingStrategy(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_countQueuingStrategyHighWaterMark')) {
						return false;
					}
					return x instanceof CountQueuingStrategy;
				}
				function convertTransformer(original, context) {
					assertDictionary(original, context);
					const flush = original === null || original === void 0 ? void 0 : original.flush;
					const readableType =
						original === null || original === void 0 ? void 0 : original.readableType;
					const start = original === null || original === void 0 ? void 0 : original.start;
					const transform = original === null || original === void 0 ? void 0 : original.transform;
					const writableType =
						original === null || original === void 0 ? void 0 : original.writableType;
					return {
						flush:
							flush === void 0
								? void 0
								: convertTransformerFlushCallback(
										flush,
										original,
										`${context} has member 'flush' that`
								  ),
						readableType,
						start:
							start === void 0
								? void 0
								: convertTransformerStartCallback(
										start,
										original,
										`${context} has member 'start' that`
								  ),
						transform:
							transform === void 0
								? void 0
								: convertTransformerTransformCallback(
										transform,
										original,
										`${context} has member 'transform' that`
								  ),
						writableType
					};
				}
				function convertTransformerFlushCallback(fn, original, context) {
					assertFunction(fn, context);
					return (controller) => promiseCall(fn, original, [controller]);
				}
				function convertTransformerStartCallback(fn, original, context) {
					assertFunction(fn, context);
					return (controller) => reflectCall(fn, original, [controller]);
				}
				function convertTransformerTransformCallback(fn, original, context) {
					assertFunction(fn, context);
					return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
				}
				class TransformStream {
					constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
						if (rawTransformer === void 0) {
							rawTransformer = null;
						}
						const writableStrategy = convertQueuingStrategy(
							rawWritableStrategy,
							'Second parameter'
						);
						const readableStrategy = convertQueuingStrategy(rawReadableStrategy, 'Third parameter');
						const transformer = convertTransformer(rawTransformer, 'First parameter');
						if (transformer.readableType !== void 0) {
							throw new RangeError('Invalid readableType specified');
						}
						if (transformer.writableType !== void 0) {
							throw new RangeError('Invalid writableType specified');
						}
						const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
						const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
						const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
						const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
						let startPromise_resolve;
						const startPromise = newPromise((resolve2) => {
							startPromise_resolve = resolve2;
						});
						InitializeTransformStream(
							this,
							startPromise,
							writableHighWaterMark,
							writableSizeAlgorithm,
							readableHighWaterMark,
							readableSizeAlgorithm
						);
						SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
						if (transformer.start !== void 0) {
							startPromise_resolve(transformer.start(this._transformStreamController));
						} else {
							startPromise_resolve(void 0);
						}
					}
					get readable() {
						if (!IsTransformStream(this)) {
							throw streamBrandCheckException('readable');
						}
						return this._readable;
					}
					get writable() {
						if (!IsTransformStream(this)) {
							throw streamBrandCheckException('writable');
						}
						return this._writable;
					}
				}
				Object.defineProperties(TransformStream.prototype, {
					readable: { enumerable: true },
					writable: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
						value: 'TransformStream',
						configurable: true
					});
				}
				function InitializeTransformStream(
					stream,
					startPromise,
					writableHighWaterMark,
					writableSizeAlgorithm,
					readableHighWaterMark,
					readableSizeAlgorithm
				) {
					function startAlgorithm() {
						return startPromise;
					}
					function writeAlgorithm(chunk) {
						return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
					}
					function abortAlgorithm(reason) {
						return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
					}
					function closeAlgorithm() {
						return TransformStreamDefaultSinkCloseAlgorithm(stream);
					}
					stream._writable = CreateWritableStream(
						startAlgorithm,
						writeAlgorithm,
						closeAlgorithm,
						abortAlgorithm,
						writableHighWaterMark,
						writableSizeAlgorithm
					);
					function pullAlgorithm() {
						return TransformStreamDefaultSourcePullAlgorithm(stream);
					}
					function cancelAlgorithm(reason) {
						TransformStreamErrorWritableAndUnblockWrite(stream, reason);
						return promiseResolvedWith(void 0);
					}
					stream._readable = CreateReadableStream(
						startAlgorithm,
						pullAlgorithm,
						cancelAlgorithm,
						readableHighWaterMark,
						readableSizeAlgorithm
					);
					stream._backpressure = void 0;
					stream._backpressureChangePromise = void 0;
					stream._backpressureChangePromise_resolve = void 0;
					TransformStreamSetBackpressure(stream, true);
					stream._transformStreamController = void 0;
				}
				function IsTransformStream(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_transformStreamController')) {
						return false;
					}
					return x instanceof TransformStream;
				}
				function TransformStreamError(stream, e) {
					ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
					TransformStreamErrorWritableAndUnblockWrite(stream, e);
				}
				function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
					TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
					WritableStreamDefaultControllerErrorIfNeeded(
						stream._writable._writableStreamController,
						e
					);
					if (stream._backpressure) {
						TransformStreamSetBackpressure(stream, false);
					}
				}
				function TransformStreamSetBackpressure(stream, backpressure) {
					if (stream._backpressureChangePromise !== void 0) {
						stream._backpressureChangePromise_resolve();
					}
					stream._backpressureChangePromise = newPromise((resolve2) => {
						stream._backpressureChangePromise_resolve = resolve2;
					});
					stream._backpressure = backpressure;
				}
				class TransformStreamDefaultController {
					constructor() {
						throw new TypeError('Illegal constructor');
					}
					get desiredSize() {
						if (!IsTransformStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException('desiredSize');
						}
						const readableController =
							this._controlledTransformStream._readable._readableStreamController;
						return ReadableStreamDefaultControllerGetDesiredSize(readableController);
					}
					enqueue(chunk = void 0) {
						if (!IsTransformStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException('enqueue');
						}
						TransformStreamDefaultControllerEnqueue(this, chunk);
					}
					error(reason = void 0) {
						if (!IsTransformStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException('error');
						}
						TransformStreamDefaultControllerError(this, reason);
					}
					terminate() {
						if (!IsTransformStreamDefaultController(this)) {
							throw defaultControllerBrandCheckException('terminate');
						}
						TransformStreamDefaultControllerTerminate(this);
					}
				}
				Object.defineProperties(TransformStreamDefaultController.prototype, {
					enqueue: { enumerable: true },
					error: { enumerable: true },
					terminate: { enumerable: true },
					desiredSize: { enumerable: true }
				});
				if (typeof SymbolPolyfill.toStringTag === 'symbol') {
					Object.defineProperty(
						TransformStreamDefaultController.prototype,
						SymbolPolyfill.toStringTag,
						{
							value: 'TransformStreamDefaultController',
							configurable: true
						}
					);
				}
				function IsTransformStreamDefaultController(x) {
					if (!typeIsObject(x)) {
						return false;
					}
					if (!Object.prototype.hasOwnProperty.call(x, '_controlledTransformStream')) {
						return false;
					}
					return x instanceof TransformStreamDefaultController;
				}
				function SetUpTransformStreamDefaultController(
					stream,
					controller,
					transformAlgorithm,
					flushAlgorithm
				) {
					controller._controlledTransformStream = stream;
					stream._transformStreamController = controller;
					controller._transformAlgorithm = transformAlgorithm;
					controller._flushAlgorithm = flushAlgorithm;
				}
				function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
					const controller = Object.create(TransformStreamDefaultController.prototype);
					let transformAlgorithm = (chunk) => {
						try {
							TransformStreamDefaultControllerEnqueue(controller, chunk);
							return promiseResolvedWith(void 0);
						} catch (transformResultE) {
							return promiseRejectedWith(transformResultE);
						}
					};
					let flushAlgorithm = () => promiseResolvedWith(void 0);
					if (transformer.transform !== void 0) {
						transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
					}
					if (transformer.flush !== void 0) {
						flushAlgorithm = () => transformer.flush(controller);
					}
					SetUpTransformStreamDefaultController(
						stream,
						controller,
						transformAlgorithm,
						flushAlgorithm
					);
				}
				function TransformStreamDefaultControllerClearAlgorithms(controller) {
					controller._transformAlgorithm = void 0;
					controller._flushAlgorithm = void 0;
				}
				function TransformStreamDefaultControllerEnqueue(controller, chunk) {
					const stream = controller._controlledTransformStream;
					const readableController = stream._readable._readableStreamController;
					if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
						throw new TypeError('Readable side is not in a state that permits enqueue');
					}
					try {
						ReadableStreamDefaultControllerEnqueue(readableController, chunk);
					} catch (e) {
						TransformStreamErrorWritableAndUnblockWrite(stream, e);
						throw stream._readable._storedError;
					}
					const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
					if (backpressure !== stream._backpressure) {
						TransformStreamSetBackpressure(stream, true);
					}
				}
				function TransformStreamDefaultControllerError(controller, e) {
					TransformStreamError(controller._controlledTransformStream, e);
				}
				function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
					const transformPromise = controller._transformAlgorithm(chunk);
					return transformPromiseWith(transformPromise, void 0, (r) => {
						TransformStreamError(controller._controlledTransformStream, r);
						throw r;
					});
				}
				function TransformStreamDefaultControllerTerminate(controller) {
					const stream = controller._controlledTransformStream;
					const readableController = stream._readable._readableStreamController;
					ReadableStreamDefaultControllerClose(readableController);
					const error2 = new TypeError('TransformStream terminated');
					TransformStreamErrorWritableAndUnblockWrite(stream, error2);
				}
				function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
					const controller = stream._transformStreamController;
					if (stream._backpressure) {
						const backpressureChangePromise = stream._backpressureChangePromise;
						return transformPromiseWith(backpressureChangePromise, () => {
							const writable2 = stream._writable;
							const state = writable2._state;
							if (state === 'erroring') {
								throw writable2._storedError;
							}
							return TransformStreamDefaultControllerPerformTransform(controller, chunk);
						});
					}
					return TransformStreamDefaultControllerPerformTransform(controller, chunk);
				}
				function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
					TransformStreamError(stream, reason);
					return promiseResolvedWith(void 0);
				}
				function TransformStreamDefaultSinkCloseAlgorithm(stream) {
					const readable = stream._readable;
					const controller = stream._transformStreamController;
					const flushPromise = controller._flushAlgorithm();
					TransformStreamDefaultControllerClearAlgorithms(controller);
					return transformPromiseWith(
						flushPromise,
						() => {
							if (readable._state === 'errored') {
								throw readable._storedError;
							}
							ReadableStreamDefaultControllerClose(readable._readableStreamController);
						},
						(r) => {
							TransformStreamError(stream, r);
							throw readable._storedError;
						}
					);
				}
				function TransformStreamDefaultSourcePullAlgorithm(stream) {
					TransformStreamSetBackpressure(stream, false);
					return stream._backpressureChangePromise;
				}
				function defaultControllerBrandCheckException(name) {
					return new TypeError(
						`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`
					);
				}
				function streamBrandCheckException(name) {
					return new TypeError(
						`TransformStream.prototype.${name} can only be used on a TransformStream`
					);
				}
				exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
				exports2.CountQueuingStrategy = CountQueuingStrategy;
				exports2.ReadableByteStreamController = ReadableByteStreamController;
				exports2.ReadableStream = ReadableStream2;
				exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
				exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
				exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
				exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
				exports2.TransformStream = TransformStream;
				exports2.TransformStreamDefaultController = TransformStreamDefaultController;
				exports2.WritableStream = WritableStream;
				exports2.WritableStreamDefaultController = WritableStreamDefaultController;
				exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
				Object.defineProperty(exports2, '__esModule', { value: true });
			});
		})(ponyfill_es2018, ponyfill_es2018.exports);
		POOL_SIZE$1 = 65536;
		if (!globalThis.ReadableStream) {
			try {
				Object.assign(globalThis, require('stream/web'));
			} catch (error2) {
				Object.assign(globalThis, ponyfill_es2018.exports);
			}
		}
		try {
			const { Blob: Blob3 } = require('buffer');
			if (Blob3 && !Blob3.prototype.stream) {
				Blob3.prototype.stream = function name(params) {
					let position = 0;
					const blob = this;
					return new ReadableStream({
						type: 'bytes',
						async pull(ctrl) {
							const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
							const buffer = await chunk.arrayBuffer();
							position += buffer.byteLength;
							ctrl.enqueue(new Uint8Array(buffer));
							if (position === blob.size) {
								ctrl.close();
							}
						}
					});
				};
			}
		} catch (error2) {}
		POOL_SIZE = 65536;
		_Blob = class Blob {
			#parts = [];
			#type = '';
			#size = 0;
			constructor(blobParts = [], options2 = {}) {
				let size = 0;
				const parts = blobParts.map((element) => {
					let part;
					if (ArrayBuffer.isView(element)) {
						part = new Uint8Array(
							element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength)
						);
					} else if (element instanceof ArrayBuffer) {
						part = new Uint8Array(element.slice(0));
					} else if (element instanceof Blob) {
						part = element;
					} else {
						part = new TextEncoder().encode(element);
					}
					size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
					return part;
				});
				const type = options2.type === void 0 ? '' : String(options2.type);
				this.#type = /[^\u0020-\u007E]/.test(type) ? '' : type;
				this.#size = size;
				this.#parts = parts;
			}
			get size() {
				return this.#size;
			}
			get type() {
				return this.#type;
			}
			async text() {
				const decoder = new TextDecoder();
				let str = '';
				for await (let part of toIterator(this.#parts, false)) {
					str += decoder.decode(part, { stream: true });
				}
				str += decoder.decode();
				return str;
			}
			async arrayBuffer() {
				const data = new Uint8Array(this.size);
				let offset = 0;
				for await (const chunk of toIterator(this.#parts, false)) {
					data.set(chunk, offset);
					offset += chunk.length;
				}
				return data.buffer;
			}
			stream() {
				const it = toIterator(this.#parts, true);
				return new ReadableStream({
					type: 'bytes',
					async pull(ctrl) {
						const chunk = await it.next();
						chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
					}
				});
			}
			slice(start = 0, end = this.size, type = '') {
				const { size } = this;
				let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
				let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
				const span = Math.max(relativeEnd - relativeStart, 0);
				const parts = this.#parts;
				const blobParts = [];
				let added = 0;
				for (const part of parts) {
					if (added >= span) {
						break;
					}
					const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
					if (relativeStart && size2 <= relativeStart) {
						relativeStart -= size2;
						relativeEnd -= size2;
					} else {
						let chunk;
						if (ArrayBuffer.isView(part)) {
							chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
							added += chunk.byteLength;
						} else {
							chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
							added += chunk.size;
						}
						blobParts.push(chunk);
						relativeStart = 0;
					}
				}
				const blob = new Blob([], { type: String(type).toLowerCase() });
				blob.#size = span;
				blob.#parts = blobParts;
				return blob;
			}
			get [Symbol.toStringTag]() {
				return 'Blob';
			}
			static [Symbol.hasInstance](object) {
				return (
					object &&
					typeof object === 'object' &&
					typeof object.constructor === 'function' &&
					(typeof object.stream === 'function' || typeof object.arrayBuffer === 'function') &&
					/^(Blob|File)$/.test(object[Symbol.toStringTag])
				);
			}
		};
		Object.defineProperties(_Blob.prototype, {
			size: { enumerable: true },
			type: { enumerable: true },
			slice: { enumerable: true }
		});
		Blob2 = _Blob;
		Blob$1 = Blob2;
		FetchBaseError = class extends Error {
			constructor(message, type) {
				super(message);
				Error.captureStackTrace(this, this.constructor);
				this.type = type;
			}
			get name() {
				return this.constructor.name;
			}
			get [Symbol.toStringTag]() {
				return this.constructor.name;
			}
		};
		FetchError = class extends FetchBaseError {
			constructor(message, type, systemError) {
				super(message, type);
				if (systemError) {
					this.code = this.errno = systemError.code;
					this.erroredSysCall = systemError.syscall;
				}
			}
		};
		NAME = Symbol.toStringTag;
		isURLSearchParameters = (object) => {
			return (
				typeof object === 'object' &&
				typeof object.append === 'function' &&
				typeof object.delete === 'function' &&
				typeof object.get === 'function' &&
				typeof object.getAll === 'function' &&
				typeof object.has === 'function' &&
				typeof object.set === 'function' &&
				typeof object.sort === 'function' &&
				object[NAME] === 'URLSearchParams'
			);
		};
		isBlob = (object) => {
			return (
				typeof object === 'object' &&
				typeof object.arrayBuffer === 'function' &&
				typeof object.type === 'string' &&
				typeof object.stream === 'function' &&
				typeof object.constructor === 'function' &&
				/^(Blob|File)$/.test(object[NAME])
			);
		};
		isAbortSignal = (object) => {
			return (
				typeof object === 'object' &&
				(object[NAME] === 'AbortSignal' || object[NAME] === 'EventTarget')
			);
		};
		carriage = '\r\n';
		dashes = '-'.repeat(2);
		carriageLength = Buffer.byteLength(carriage);
		getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
		getBoundary = () => (0, import_crypto.randomBytes)(8).toString('hex');
		INTERNALS$2 = Symbol('Body internals');
		Body = class {
			constructor(body, { size = 0 } = {}) {
				let boundary = null;
				if (body === null) {
					body = null;
				} else if (isURLSearchParameters(body)) {
					body = Buffer.from(body.toString());
				} else if (isBlob(body));
				else if (Buffer.isBuffer(body));
				else if (import_util.types.isAnyArrayBuffer(body)) {
					body = Buffer.from(body);
				} else if (ArrayBuffer.isView(body)) {
					body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
				} else if (body instanceof import_stream.default);
				else if (isFormData(body)) {
					boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
					body = import_stream.default.Readable.from(formDataIterator(body, boundary));
				} else {
					body = Buffer.from(String(body));
				}
				this[INTERNALS$2] = {
					body,
					boundary,
					disturbed: false,
					error: null
				};
				this.size = size;
				if (body instanceof import_stream.default) {
					body.on('error', (error_) => {
						const error2 =
							error_ instanceof FetchBaseError
								? error_
								: new FetchError(
										`Invalid response body while trying to fetch ${this.url}: ${error_.message}`,
										'system',
										error_
								  );
						this[INTERNALS$2].error = error2;
					});
				}
			}
			get body() {
				return this[INTERNALS$2].body;
			}
			get bodyUsed() {
				return this[INTERNALS$2].disturbed;
			}
			async arrayBuffer() {
				const { buffer, byteOffset, byteLength } = await consumeBody(this);
				return buffer.slice(byteOffset, byteOffset + byteLength);
			}
			async blob() {
				const ct =
					(this.headers && this.headers.get('content-type')) ||
					(this[INTERNALS$2].body && this[INTERNALS$2].body.type) ||
					'';
				const buf = await this.buffer();
				return new Blob$1([buf], {
					type: ct
				});
			}
			async json() {
				const buffer = await consumeBody(this);
				return JSON.parse(buffer.toString());
			}
			async text() {
				const buffer = await consumeBody(this);
				return buffer.toString();
			}
			buffer() {
				return consumeBody(this);
			}
		};
		Object.defineProperties(Body.prototype, {
			body: { enumerable: true },
			bodyUsed: { enumerable: true },
			arrayBuffer: { enumerable: true },
			blob: { enumerable: true },
			json: { enumerable: true },
			text: { enumerable: true }
		});
		clone = (instance, highWaterMark) => {
			let p1;
			let p2;
			let { body } = instance;
			if (instance.bodyUsed) {
				throw new Error('cannot clone body after it is used');
			}
			if (body instanceof import_stream.default && typeof body.getBoundary !== 'function') {
				p1 = new import_stream.PassThrough({ highWaterMark });
				p2 = new import_stream.PassThrough({ highWaterMark });
				body.pipe(p1);
				body.pipe(p2);
				instance[INTERNALS$2].body = p1;
				body = p2;
			}
			return body;
		};
		extractContentType = (body, request) => {
			if (body === null) {
				return null;
			}
			if (typeof body === 'string') {
				return 'text/plain;charset=UTF-8';
			}
			if (isURLSearchParameters(body)) {
				return 'application/x-www-form-urlencoded;charset=UTF-8';
			}
			if (isBlob(body)) {
				return body.type || null;
			}
			if (
				Buffer.isBuffer(body) ||
				import_util.types.isAnyArrayBuffer(body) ||
				ArrayBuffer.isView(body)
			) {
				return null;
			}
			if (body && typeof body.getBoundary === 'function') {
				return `multipart/form-data;boundary=${body.getBoundary()}`;
			}
			if (isFormData(body)) {
				return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
			}
			if (body instanceof import_stream.default) {
				return null;
			}
			return 'text/plain;charset=UTF-8';
		};
		getTotalBytes = (request) => {
			const { body } = request;
			if (body === null) {
				return 0;
			}
			if (isBlob(body)) {
				return body.size;
			}
			if (Buffer.isBuffer(body)) {
				return body.length;
			}
			if (body && typeof body.getLengthSync === 'function') {
				return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
			}
			if (isFormData(body)) {
				return getFormDataLength(request[INTERNALS$2].boundary);
			}
			return null;
		};
		writeToStream = (dest, { body }) => {
			if (body === null) {
				dest.end();
			} else if (isBlob(body)) {
				import_stream.default.Readable.from(body.stream()).pipe(dest);
			} else if (Buffer.isBuffer(body)) {
				dest.write(body);
				dest.end();
			} else {
				body.pipe(dest);
			}
		};
		validateHeaderName =
			typeof import_http.default.validateHeaderName === 'function'
				? import_http.default.validateHeaderName
				: (name) => {
						if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
							const error2 = new TypeError(`Header name must be a valid HTTP token [${name}]`);
							Object.defineProperty(error2, 'code', { value: 'ERR_INVALID_HTTP_TOKEN' });
							throw error2;
						}
				  };
		validateHeaderValue =
			typeof import_http.default.validateHeaderValue === 'function'
				? import_http.default.validateHeaderValue
				: (name, value) => {
						if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
							const error2 = new TypeError(`Invalid character in header content ["${name}"]`);
							Object.defineProperty(error2, 'code', { value: 'ERR_INVALID_CHAR' });
							throw error2;
						}
				  };
		Headers = class extends URLSearchParams {
			constructor(init2) {
				let result = [];
				if (init2 instanceof Headers) {
					const raw = init2.raw();
					for (const [name, values] of Object.entries(raw)) {
						result.push(...values.map((value) => [name, value]));
					}
				} else if (init2 == null);
				else if (typeof init2 === 'object' && !import_util.types.isBoxedPrimitive(init2)) {
					const method = init2[Symbol.iterator];
					if (method == null) {
						result.push(...Object.entries(init2));
					} else {
						if (typeof method !== 'function') {
							throw new TypeError('Header pairs must be iterable');
						}
						result = [...init2]
							.map((pair) => {
								if (typeof pair !== 'object' || import_util.types.isBoxedPrimitive(pair)) {
									throw new TypeError('Each header pair must be an iterable object');
								}
								return [...pair];
							})
							.map((pair) => {
								if (pair.length !== 2) {
									throw new TypeError('Each header pair must be a name/value tuple');
								}
								return [...pair];
							});
					}
				} else {
					throw new TypeError(
						"Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)"
					);
				}
				result =
					result.length > 0
						? result.map(([name, value]) => {
								validateHeaderName(name);
								validateHeaderValue(name, String(value));
								return [String(name).toLowerCase(), String(value)];
						  })
						: void 0;
				super(result);
				return new Proxy(this, {
					get(target, p, receiver) {
						switch (p) {
							case 'append':
							case 'set':
								return (name, value) => {
									validateHeaderName(name);
									validateHeaderValue(name, String(value));
									return URLSearchParams.prototype[p].call(
										target,
										String(name).toLowerCase(),
										String(value)
									);
								};
							case 'delete':
							case 'has':
							case 'getAll':
								return (name) => {
									validateHeaderName(name);
									return URLSearchParams.prototype[p].call(target, String(name).toLowerCase());
								};
							case 'keys':
								return () => {
									target.sort();
									return new Set(URLSearchParams.prototype.keys.call(target)).keys();
								};
							default:
								return Reflect.get(target, p, receiver);
						}
					}
				});
			}
			get [Symbol.toStringTag]() {
				return this.constructor.name;
			}
			toString() {
				return Object.prototype.toString.call(this);
			}
			get(name) {
				const values = this.getAll(name);
				if (values.length === 0) {
					return null;
				}
				let value = values.join(', ');
				if (/^content-encoding$/i.test(name)) {
					value = value.toLowerCase();
				}
				return value;
			}
			forEach(callback, thisArg = void 0) {
				for (const name of this.keys()) {
					Reflect.apply(callback, thisArg, [this.get(name), name, this]);
				}
			}
			*values() {
				for (const name of this.keys()) {
					yield this.get(name);
				}
			}
			*entries() {
				for (const name of this.keys()) {
					yield [name, this.get(name)];
				}
			}
			[Symbol.iterator]() {
				return this.entries();
			}
			raw() {
				return [...this.keys()].reduce((result, key) => {
					result[key] = this.getAll(key);
					return result;
				}, {});
			}
			[Symbol.for('nodejs.util.inspect.custom')]() {
				return [...this.keys()].reduce((result, key) => {
					const values = this.getAll(key);
					if (key === 'host') {
						result[key] = values[0];
					} else {
						result[key] = values.length > 1 ? values : values[0];
					}
					return result;
				}, {});
			}
		};
		Object.defineProperties(
			Headers.prototype,
			['get', 'entries', 'forEach', 'values'].reduce((result, property) => {
				result[property] = { enumerable: true };
				return result;
			}, {})
		);
		redirectStatus = new Set([301, 302, 303, 307, 308]);
		isRedirect = (code) => {
			return redirectStatus.has(code);
		};
		INTERNALS$1 = Symbol('Response internals');
		Response = class extends Body {
			constructor(body = null, options2 = {}) {
				super(body, options2);
				const status = options2.status != null ? options2.status : 200;
				const headers = new Headers(options2.headers);
				if (body !== null && !headers.has('Content-Type')) {
					const contentType = extractContentType(body);
					if (contentType) {
						headers.append('Content-Type', contentType);
					}
				}
				this[INTERNALS$1] = {
					type: 'default',
					url: options2.url,
					status,
					statusText: options2.statusText || '',
					headers,
					counter: options2.counter,
					highWaterMark: options2.highWaterMark
				};
			}
			get type() {
				return this[INTERNALS$1].type;
			}
			get url() {
				return this[INTERNALS$1].url || '';
			}
			get status() {
				return this[INTERNALS$1].status;
			}
			get ok() {
				return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
			}
			get redirected() {
				return this[INTERNALS$1].counter > 0;
			}
			get statusText() {
				return this[INTERNALS$1].statusText;
			}
			get headers() {
				return this[INTERNALS$1].headers;
			}
			get highWaterMark() {
				return this[INTERNALS$1].highWaterMark;
			}
			clone() {
				return new Response(clone(this, this.highWaterMark), {
					type: this.type,
					url: this.url,
					status: this.status,
					statusText: this.statusText,
					headers: this.headers,
					ok: this.ok,
					redirected: this.redirected,
					size: this.size
				});
			}
			static redirect(url, status = 302) {
				if (!isRedirect(status)) {
					throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
				}
				return new Response(null, {
					headers: {
						location: new URL(url).toString()
					},
					status
				});
			}
			static error() {
				const response = new Response(null, { status: 0, statusText: '' });
				response[INTERNALS$1].type = 'error';
				return response;
			}
			get [Symbol.toStringTag]() {
				return 'Response';
			}
		};
		Object.defineProperties(Response.prototype, {
			type: { enumerable: true },
			url: { enumerable: true },
			status: { enumerable: true },
			ok: { enumerable: true },
			redirected: { enumerable: true },
			statusText: { enumerable: true },
			headers: { enumerable: true },
			clone: { enumerable: true }
		});
		getSearch = (parsedURL) => {
			if (parsedURL.search) {
				return parsedURL.search;
			}
			const lastOffset = parsedURL.href.length - 1;
			const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === '#' ? '#' : '');
			return parsedURL.href[lastOffset - hash2.length] === '?' ? '?' : '';
		};
		INTERNALS = Symbol('Request internals');
		isRequest = (object) => {
			return typeof object === 'object' && typeof object[INTERNALS] === 'object';
		};
		Request = class extends Body {
			constructor(input, init2 = {}) {
				let parsedURL;
				if (isRequest(input)) {
					parsedURL = new URL(input.url);
				} else {
					parsedURL = new URL(input);
					input = {};
				}
				let method = init2.method || input.method || 'GET';
				method = method.toUpperCase();
				if (
					(init2.body != null || isRequest(input)) &&
					input.body !== null &&
					(method === 'GET' || method === 'HEAD')
				) {
					throw new TypeError('Request with GET/HEAD method cannot have body');
				}
				const inputBody = init2.body
					? init2.body
					: isRequest(input) && input.body !== null
					? clone(input)
					: null;
				super(inputBody, {
					size: init2.size || input.size || 0
				});
				const headers = new Headers(init2.headers || input.headers || {});
				if (inputBody !== null && !headers.has('Content-Type')) {
					const contentType = extractContentType(inputBody, this);
					if (contentType) {
						headers.append('Content-Type', contentType);
					}
				}
				let signal = isRequest(input) ? input.signal : null;
				if ('signal' in init2) {
					signal = init2.signal;
				}
				if (signal != null && !isAbortSignal(signal)) {
					throw new TypeError('Expected signal to be an instanceof AbortSignal or EventTarget');
				}
				this[INTERNALS] = {
					method,
					redirect: init2.redirect || input.redirect || 'follow',
					headers,
					parsedURL,
					signal
				};
				this.follow =
					init2.follow === void 0 ? (input.follow === void 0 ? 20 : input.follow) : init2.follow;
				this.compress =
					init2.compress === void 0
						? input.compress === void 0
							? true
							: input.compress
						: init2.compress;
				this.counter = init2.counter || input.counter || 0;
				this.agent = init2.agent || input.agent;
				this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
				this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
			}
			get method() {
				return this[INTERNALS].method;
			}
			get url() {
				return (0, import_url.format)(this[INTERNALS].parsedURL);
			}
			get headers() {
				return this[INTERNALS].headers;
			}
			get redirect() {
				return this[INTERNALS].redirect;
			}
			get signal() {
				return this[INTERNALS].signal;
			}
			clone() {
				return new Request(this);
			}
			get [Symbol.toStringTag]() {
				return 'Request';
			}
		};
		Object.defineProperties(Request.prototype, {
			method: { enumerable: true },
			url: { enumerable: true },
			headers: { enumerable: true },
			redirect: { enumerable: true },
			clone: { enumerable: true },
			signal: { enumerable: true }
		});
		getNodeRequestOptions = (request) => {
			const { parsedURL } = request[INTERNALS];
			const headers = new Headers(request[INTERNALS].headers);
			if (!headers.has('Accept')) {
				headers.set('Accept', '*/*');
			}
			let contentLengthValue = null;
			if (request.body === null && /^(post|put)$/i.test(request.method)) {
				contentLengthValue = '0';
			}
			if (request.body !== null) {
				const totalBytes = getTotalBytes(request);
				if (typeof totalBytes === 'number' && !Number.isNaN(totalBytes)) {
					contentLengthValue = String(totalBytes);
				}
			}
			if (contentLengthValue) {
				headers.set('Content-Length', contentLengthValue);
			}
			if (!headers.has('User-Agent')) {
				headers.set('User-Agent', 'node-fetch');
			}
			if (request.compress && !headers.has('Accept-Encoding')) {
				headers.set('Accept-Encoding', 'gzip,deflate,br');
			}
			let { agent } = request;
			if (typeof agent === 'function') {
				agent = agent(parsedURL);
			}
			if (!headers.has('Connection') && !agent) {
				headers.set('Connection', 'close');
			}
			const search = getSearch(parsedURL);
			const requestOptions = {
				path: parsedURL.pathname + search,
				pathname: parsedURL.pathname,
				hostname: parsedURL.hostname,
				protocol: parsedURL.protocol,
				port: parsedURL.port,
				hash: parsedURL.hash,
				search: parsedURL.search,
				query: parsedURL.query,
				href: parsedURL.href,
				method: request.method,
				headers: headers[Symbol.for('nodejs.util.inspect.custom')](),
				insecureHTTPParser: request.insecureHTTPParser,
				agent
			};
			return requestOptions;
		};
		AbortError = class extends FetchBaseError {
			constructor(message, type = 'aborted') {
				super(message, type);
			}
		};
		supportedSchemas = new Set(['data:', 'http:', 'https:']);
	}
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
	'node_modules/@sveltejs/adapter-vercel/files/shims.js'() {
		init_install_fetch();
	}
});

// node_modules/@babel/runtime/helpers/extends.js
var require_extends = __commonJS({
	'node_modules/@babel/runtime/helpers/extends.js'(exports, module2) {
		init_shims();
		function _extends() {
			module2.exports = _extends =
				Object.assign ||
				function (target) {
					for (var i = 1; i < arguments.length; i++) {
						var source = arguments[i];
						for (var key in source) {
							if (Object.prototype.hasOwnProperty.call(source, key)) {
								target[key] = source[key];
							}
						}
					}
					return target;
				};
			(module2.exports['default'] = module2.exports), (module2.exports.__esModule = true);
			return _extends.apply(this, arguments);
		}
		module2.exports = _extends;
		(module2.exports['default'] = module2.exports), (module2.exports.__esModule = true);
	}
});

// node_modules/remove-accents/index.js
var require_remove_accents = __commonJS({
	'node_modules/remove-accents/index.js'(exports, module2) {
		init_shims();
		var characterMap = {
			'\xC0': 'A',
			'\xC1': 'A',
			'\xC2': 'A',
			'\xC3': 'A',
			'\xC4': 'A',
			'\xC5': 'A',
			'\u1EA4': 'A',
			'\u1EAE': 'A',
			'\u1EB2': 'A',
			'\u1EB4': 'A',
			'\u1EB6': 'A',
			'\xC6': 'AE',
			'\u1EA6': 'A',
			'\u1EB0': 'A',
			'\u0202': 'A',
			'\xC7': 'C',
			'\u1E08': 'C',
			'\xC8': 'E',
			'\xC9': 'E',
			'\xCA': 'E',
			'\xCB': 'E',
			'\u1EBE': 'E',
			'\u1E16': 'E',
			'\u1EC0': 'E',
			'\u1E14': 'E',
			'\u1E1C': 'E',
			'\u0206': 'E',
			'\xCC': 'I',
			'\xCD': 'I',
			'\xCE': 'I',
			'\xCF': 'I',
			'\u1E2E': 'I',
			'\u020A': 'I',
			'\xD0': 'D',
			'\xD1': 'N',
			'\xD2': 'O',
			'\xD3': 'O',
			'\xD4': 'O',
			'\xD5': 'O',
			'\xD6': 'O',
			'\xD8': 'O',
			'\u1ED0': 'O',
			'\u1E4C': 'O',
			'\u1E52': 'O',
			'\u020E': 'O',
			'\xD9': 'U',
			'\xDA': 'U',
			'\xDB': 'U',
			'\xDC': 'U',
			'\xDD': 'Y',
			'\xE0': 'a',
			'\xE1': 'a',
			'\xE2': 'a',
			'\xE3': 'a',
			'\xE4': 'a',
			'\xE5': 'a',
			'\u1EA5': 'a',
			'\u1EAF': 'a',
			'\u1EB3': 'a',
			'\u1EB5': 'a',
			'\u1EB7': 'a',
			'\xE6': 'ae',
			'\u1EA7': 'a',
			'\u1EB1': 'a',
			'\u0203': 'a',
			'\xE7': 'c',
			'\u1E09': 'c',
			'\xE8': 'e',
			'\xE9': 'e',
			'\xEA': 'e',
			'\xEB': 'e',
			'\u1EBF': 'e',
			'\u1E17': 'e',
			'\u1EC1': 'e',
			'\u1E15': 'e',
			'\u1E1D': 'e',
			'\u0207': 'e',
			'\xEC': 'i',
			'\xED': 'i',
			'\xEE': 'i',
			'\xEF': 'i',
			'\u1E2F': 'i',
			'\u020B': 'i',
			'\xF0': 'd',
			'\xF1': 'n',
			'\xF2': 'o',
			'\xF3': 'o',
			'\xF4': 'o',
			'\xF5': 'o',
			'\xF6': 'o',
			'\xF8': 'o',
			'\u1ED1': 'o',
			'\u1E4D': 'o',
			'\u1E53': 'o',
			'\u020F': 'o',
			'\xF9': 'u',
			'\xFA': 'u',
			'\xFB': 'u',
			'\xFC': 'u',
			'\xFD': 'y',
			'\xFF': 'y',
			'\u0100': 'A',
			'\u0101': 'a',
			'\u0102': 'A',
			'\u0103': 'a',
			'\u0104': 'A',
			'\u0105': 'a',
			'\u0106': 'C',
			'\u0107': 'c',
			'\u0108': 'C',
			'\u0109': 'c',
			'\u010A': 'C',
			'\u010B': 'c',
			'\u010C': 'C',
			'\u010D': 'c',
			'C\u0306': 'C',
			'c\u0306': 'c',
			'\u010E': 'D',
			'\u010F': 'd',
			'\u0110': 'D',
			'\u0111': 'd',
			'\u0112': 'E',
			'\u0113': 'e',
			'\u0114': 'E',
			'\u0115': 'e',
			'\u0116': 'E',
			'\u0117': 'e',
			'\u0118': 'E',
			'\u0119': 'e',
			'\u011A': 'E',
			'\u011B': 'e',
			'\u011C': 'G',
			'\u01F4': 'G',
			'\u011D': 'g',
			'\u01F5': 'g',
			'\u011E': 'G',
			'\u011F': 'g',
			'\u0120': 'G',
			'\u0121': 'g',
			'\u0122': 'G',
			'\u0123': 'g',
			'\u0124': 'H',
			'\u0125': 'h',
			'\u0126': 'H',
			'\u0127': 'h',
			'\u1E2A': 'H',
			'\u1E2B': 'h',
			'\u0128': 'I',
			'\u0129': 'i',
			'\u012A': 'I',
			'\u012B': 'i',
			'\u012C': 'I',
			'\u012D': 'i',
			'\u012E': 'I',
			'\u012F': 'i',
			'\u0130': 'I',
			'\u0131': 'i',
			'\u0132': 'IJ',
			'\u0133': 'ij',
			'\u0134': 'J',
			'\u0135': 'j',
			'\u0136': 'K',
			'\u0137': 'k',
			'\u1E30': 'K',
			'\u1E31': 'k',
			'K\u0306': 'K',
			'k\u0306': 'k',
			'\u0139': 'L',
			'\u013A': 'l',
			'\u013B': 'L',
			'\u013C': 'l',
			'\u013D': 'L',
			'\u013E': 'l',
			'\u013F': 'L',
			'\u0140': 'l',
			'\u0141': 'l',
			'\u0142': 'l',
			'\u1E3E': 'M',
			'\u1E3F': 'm',
			'M\u0306': 'M',
			'm\u0306': 'm',
			'\u0143': 'N',
			'\u0144': 'n',
			'\u0145': 'N',
			'\u0146': 'n',
			'\u0147': 'N',
			'\u0148': 'n',
			'\u0149': 'n',
			'N\u0306': 'N',
			'n\u0306': 'n',
			'\u014C': 'O',
			'\u014D': 'o',
			'\u014E': 'O',
			'\u014F': 'o',
			'\u0150': 'O',
			'\u0151': 'o',
			'\u0152': 'OE',
			'\u0153': 'oe',
			'P\u0306': 'P',
			'p\u0306': 'p',
			'\u0154': 'R',
			'\u0155': 'r',
			'\u0156': 'R',
			'\u0157': 'r',
			'\u0158': 'R',
			'\u0159': 'r',
			'R\u0306': 'R',
			'r\u0306': 'r',
			'\u0212': 'R',
			'\u0213': 'r',
			'\u015A': 'S',
			'\u015B': 's',
			'\u015C': 'S',
			'\u015D': 's',
			'\u015E': 'S',
			'\u0218': 'S',
			'\u0219': 's',
			'\u015F': 's',
			'\u0160': 'S',
			'\u0161': 's',
			'\u0162': 'T',
			'\u0163': 't',
			'\u021B': 't',
			'\u021A': 'T',
			'\u0164': 'T',
			'\u0165': 't',
			'\u0166': 'T',
			'\u0167': 't',
			'T\u0306': 'T',
			't\u0306': 't',
			'\u0168': 'U',
			'\u0169': 'u',
			'\u016A': 'U',
			'\u016B': 'u',
			'\u016C': 'U',
			'\u016D': 'u',
			'\u016E': 'U',
			'\u016F': 'u',
			'\u0170': 'U',
			'\u0171': 'u',
			'\u0172': 'U',
			'\u0173': 'u',
			'\u0216': 'U',
			'\u0217': 'u',
			'V\u0306': 'V',
			'v\u0306': 'v',
			'\u0174': 'W',
			'\u0175': 'w',
			'\u1E82': 'W',
			'\u1E83': 'w',
			'X\u0306': 'X',
			'x\u0306': 'x',
			'\u0176': 'Y',
			'\u0177': 'y',
			'\u0178': 'Y',
			'Y\u0306': 'Y',
			'y\u0306': 'y',
			'\u0179': 'Z',
			'\u017A': 'z',
			'\u017B': 'Z',
			'\u017C': 'z',
			'\u017D': 'Z',
			'\u017E': 'z',
			'\u017F': 's',
			'\u0192': 'f',
			'\u01A0': 'O',
			'\u01A1': 'o',
			'\u01AF': 'U',
			'\u01B0': 'u',
			'\u01CD': 'A',
			'\u01CE': 'a',
			'\u01CF': 'I',
			'\u01D0': 'i',
			'\u01D1': 'O',
			'\u01D2': 'o',
			'\u01D3': 'U',
			'\u01D4': 'u',
			'\u01D5': 'U',
			'\u01D6': 'u',
			'\u01D7': 'U',
			'\u01D8': 'u',
			'\u01D9': 'U',
			'\u01DA': 'u',
			'\u01DB': 'U',
			'\u01DC': 'u',
			'\u1EE8': 'U',
			'\u1EE9': 'u',
			'\u1E78': 'U',
			'\u1E79': 'u',
			'\u01FA': 'A',
			'\u01FB': 'a',
			'\u01FC': 'AE',
			'\u01FD': 'ae',
			'\u01FE': 'O',
			'\u01FF': 'o',
			'\xDE': 'TH',
			'\xFE': 'th',
			'\u1E54': 'P',
			'\u1E55': 'p',
			'\u1E64': 'S',
			'\u1E65': 's',
			'X\u0301': 'X',
			'x\u0301': 'x',
			'\u0403': '\u0413',
			'\u0453': '\u0433',
			'\u040C': '\u041A',
			'\u045C': '\u043A',
			'A\u030B': 'A',
			'a\u030B': 'a',
			'E\u030B': 'E',
			'e\u030B': 'e',
			'I\u030B': 'I',
			'i\u030B': 'i',
			'\u01F8': 'N',
			'\u01F9': 'n',
			'\u1ED2': 'O',
			'\u1ED3': 'o',
			'\u1E50': 'O',
			'\u1E51': 'o',
			'\u1EEA': 'U',
			'\u1EEB': 'u',
			'\u1E80': 'W',
			'\u1E81': 'w',
			'\u1EF2': 'Y',
			'\u1EF3': 'y',
			'\u0200': 'A',
			'\u0201': 'a',
			'\u0204': 'E',
			'\u0205': 'e',
			'\u0208': 'I',
			'\u0209': 'i',
			'\u020C': 'O',
			'\u020D': 'o',
			'\u0210': 'R',
			'\u0211': 'r',
			'\u0214': 'U',
			'\u0215': 'u',
			'B\u030C': 'B',
			'b\u030C': 'b',
			'\u010C\u0323': 'C',
			'\u010D\u0323': 'c',
			'\xCA\u030C': 'E',
			'\xEA\u030C': 'e',
			'F\u030C': 'F',
			'f\u030C': 'f',
			'\u01E6': 'G',
			'\u01E7': 'g',
			'\u021E': 'H',
			'\u021F': 'h',
			'J\u030C': 'J',
			'\u01F0': 'j',
			'\u01E8': 'K',
			'\u01E9': 'k',
			'M\u030C': 'M',
			'm\u030C': 'm',
			'P\u030C': 'P',
			'p\u030C': 'p',
			'Q\u030C': 'Q',
			'q\u030C': 'q',
			'\u0158\u0329': 'R',
			'\u0159\u0329': 'r',
			'\u1E66': 'S',
			'\u1E67': 's',
			'V\u030C': 'V',
			'v\u030C': 'v',
			'W\u030C': 'W',
			'w\u030C': 'w',
			'X\u030C': 'X',
			'x\u030C': 'x',
			'Y\u030C': 'Y',
			'y\u030C': 'y',
			'A\u0327': 'A',
			'a\u0327': 'a',
			'B\u0327': 'B',
			'b\u0327': 'b',
			'\u1E10': 'D',
			'\u1E11': 'd',
			'\u0228': 'E',
			'\u0229': 'e',
			'\u0190\u0327': 'E',
			'\u025B\u0327': 'e',
			'\u1E28': 'H',
			'\u1E29': 'h',
			'I\u0327': 'I',
			'i\u0327': 'i',
			'\u0197\u0327': 'I',
			'\u0268\u0327': 'i',
			'M\u0327': 'M',
			'm\u0327': 'm',
			'O\u0327': 'O',
			'o\u0327': 'o',
			'Q\u0327': 'Q',
			'q\u0327': 'q',
			'U\u0327': 'U',
			'u\u0327': 'u',
			'X\u0327': 'X',
			'x\u0327': 'x',
			'Z\u0327': 'Z',
			'z\u0327': 'z'
		};
		var chars2 = Object.keys(characterMap).join('|');
		var allAccents = new RegExp(chars2, 'g');
		var firstAccent = new RegExp(chars2, '');
		var removeAccents = function (string) {
			return string.replace(allAccents, function (match) {
				return characterMap[match];
			});
		};
		var hasAccents = function (string) {
			return !!string.match(firstAccent);
		};
		module2.exports = removeAccents;
		module2.exports.has = hasAccents;
		module2.exports.remove = removeAccents;
	}
});

// node_modules/match-sorter/dist/match-sorter.cjs.js
var require_match_sorter_cjs = __commonJS({
	'node_modules/match-sorter/dist/match-sorter.cjs.js'(exports) {
		init_shims();
		('use strict');
		Object.defineProperty(exports, '__esModule', { value: true });
		var _extends = require_extends();
		var removeAccents = require_remove_accents();
		function _interopDefaultLegacy(e) {
			return e && typeof e === 'object' && 'default' in e ? e : { default: e };
		}
		var _extends__default = /* @__PURE__ */ _interopDefaultLegacy(_extends);
		var removeAccents__default = /* @__PURE__ */ _interopDefaultLegacy(removeAccents);
		var rankings = {
			CASE_SENSITIVE_EQUAL: 7,
			EQUAL: 6,
			STARTS_WITH: 5,
			WORD_STARTS_WITH: 4,
			CONTAINS: 3,
			ACRONYM: 2,
			MATCHES: 1,
			NO_MATCH: 0
		};
		matchSorter2.rankings = rankings;
		var defaultBaseSortFn = function defaultBaseSortFn2(a, b) {
			return String(a.rankedValue).localeCompare(String(b.rankedValue));
		};
		function matchSorter2(items, value, options2) {
			if (options2 === void 0) {
				options2 = {};
			}
			var _options = options2,
				keys = _options.keys,
				_options$threshold = _options.threshold,
				threshold = _options$threshold === void 0 ? rankings.MATCHES : _options$threshold,
				_options$baseSort = _options.baseSort,
				baseSort = _options$baseSort === void 0 ? defaultBaseSortFn : _options$baseSort,
				_options$sorter = _options.sorter,
				sorter =
					_options$sorter === void 0
						? function (matchedItems2) {
								return matchedItems2.sort(function (a, b) {
									return sortRankedValues(a, b, baseSort);
								});
						  }
						: _options$sorter;
			var matchedItems = items.reduce(reduceItemsToRanked, []);
			return sorter(matchedItems).map(function (_ref) {
				var item = _ref.item;
				return item;
			});
			function reduceItemsToRanked(matches, item, index2) {
				var rankingInfo = getHighestRanking(item, keys, value, options2);
				var rank = rankingInfo.rank,
					_rankingInfo$keyThres = rankingInfo.keyThreshold,
					keyThreshold = _rankingInfo$keyThres === void 0 ? threshold : _rankingInfo$keyThres;
				if (rank >= keyThreshold) {
					matches.push(
						_extends__default['default']({}, rankingInfo, {
							item,
							index: index2
						})
					);
				}
				return matches;
			}
		}
		function getHighestRanking(item, keys, value, options2) {
			if (!keys) {
				var stringItem = item;
				return {
					rankedValue: stringItem,
					rank: getMatchRanking(stringItem, value, options2),
					keyIndex: -1,
					keyThreshold: options2.threshold
				};
			}
			var valuesToRank = getAllValuesToRank(item, keys);
			return valuesToRank.reduce(
				function (_ref2, _ref3, i) {
					var rank = _ref2.rank,
						rankedValue = _ref2.rankedValue,
						keyIndex = _ref2.keyIndex,
						keyThreshold = _ref2.keyThreshold;
					var itemValue = _ref3.itemValue,
						attributes = _ref3.attributes;
					var newRank = getMatchRanking(itemValue, value, options2);
					var newRankedValue = rankedValue;
					var minRanking = attributes.minRanking,
						maxRanking = attributes.maxRanking,
						threshold = attributes.threshold;
					if (newRank < minRanking && newRank >= rankings.MATCHES) {
						newRank = minRanking;
					} else if (newRank > maxRanking) {
						newRank = maxRanking;
					}
					if (newRank > rank) {
						rank = newRank;
						keyIndex = i;
						keyThreshold = threshold;
						newRankedValue = itemValue;
					}
					return {
						rankedValue: newRankedValue,
						rank,
						keyIndex,
						keyThreshold
					};
				},
				{
					rankedValue: item,
					rank: rankings.NO_MATCH,
					keyIndex: -1,
					keyThreshold: options2.threshold
				}
			);
		}
		function getMatchRanking(testString, stringToRank, options2) {
			testString = prepareValueForComparison(testString, options2);
			stringToRank = prepareValueForComparison(stringToRank, options2);
			if (stringToRank.length > testString.length) {
				return rankings.NO_MATCH;
			}
			if (testString === stringToRank) {
				return rankings.CASE_SENSITIVE_EQUAL;
			}
			testString = testString.toLowerCase();
			stringToRank = stringToRank.toLowerCase();
			if (testString === stringToRank) {
				return rankings.EQUAL;
			}
			if (testString.startsWith(stringToRank)) {
				return rankings.STARTS_WITH;
			}
			if (testString.includes(' ' + stringToRank)) {
				return rankings.WORD_STARTS_WITH;
			}
			if (testString.includes(stringToRank)) {
				return rankings.CONTAINS;
			} else if (stringToRank.length === 1) {
				return rankings.NO_MATCH;
			}
			if (getAcronym(testString).includes(stringToRank)) {
				return rankings.ACRONYM;
			}
			return getClosenessRanking(testString, stringToRank);
		}
		function getAcronym(string) {
			var acronym = '';
			var wordsInString = string.split(' ');
			wordsInString.forEach(function (wordInString) {
				var splitByHyphenWords = wordInString.split('-');
				splitByHyphenWords.forEach(function (splitByHyphenWord) {
					acronym += splitByHyphenWord.substr(0, 1);
				});
			});
			return acronym;
		}
		function getClosenessRanking(testString, stringToRank) {
			var matchingInOrderCharCount = 0;
			var charNumber = 0;
			function findMatchingCharacter(matchChar2, string, index2) {
				for (var j = index2, J = string.length; j < J; j++) {
					var stringChar = string[j];
					if (stringChar === matchChar2) {
						matchingInOrderCharCount += 1;
						return j + 1;
					}
				}
				return -1;
			}
			function getRanking(spread2) {
				var spreadPercentage = 1 / spread2;
				var inOrderPercentage = matchingInOrderCharCount / stringToRank.length;
				var ranking = rankings.MATCHES + inOrderPercentage * spreadPercentage;
				return ranking;
			}
			var firstIndex = findMatchingCharacter(stringToRank[0], testString, 0);
			if (firstIndex < 0) {
				return rankings.NO_MATCH;
			}
			charNumber = firstIndex;
			for (var i = 1, I = stringToRank.length; i < I; i++) {
				var matchChar = stringToRank[i];
				charNumber = findMatchingCharacter(matchChar, testString, charNumber);
				var found = charNumber > -1;
				if (!found) {
					return rankings.NO_MATCH;
				}
			}
			var spread = charNumber - firstIndex;
			return getRanking(spread);
		}
		function sortRankedValues(a, b, baseSort) {
			var aFirst = -1;
			var bFirst = 1;
			var aRank = a.rank,
				aKeyIndex = a.keyIndex;
			var bRank = b.rank,
				bKeyIndex = b.keyIndex;
			var same = aRank === bRank;
			if (same) {
				if (aKeyIndex === bKeyIndex) {
					return baseSort(a, b);
				} else {
					return aKeyIndex < bKeyIndex ? aFirst : bFirst;
				}
			} else {
				return aRank > bRank ? aFirst : bFirst;
			}
		}
		function prepareValueForComparison(value, _ref4) {
			var keepDiacritics = _ref4.keepDiacritics;
			value = '' + value;
			if (!keepDiacritics) {
				value = removeAccents__default['default'](value);
			}
			return value;
		}
		function getItemValues(item, key) {
			if (typeof key === 'object') {
				key = key.key;
			}
			var value;
			if (typeof key === 'function') {
				value = key(item);
			} else if (item == null) {
				value = null;
			} else if (Object.hasOwnProperty.call(item, key)) {
				value = item[key];
			} else if (key.includes('.')) {
				return getNestedValues(key, item);
			} else {
				value = null;
			}
			if (value == null) {
				return [];
			}
			if (Array.isArray(value)) {
				return value;
			}
			return [String(value)];
		}
		function getNestedValues(path, item) {
			var keys = path.split('.');
			var values = [item];
			for (var i = 0, I = keys.length; i < I; i++) {
				var nestedKey = keys[i];
				var nestedValues = [];
				for (var j = 0, J = values.length; j < J; j++) {
					var nestedItem = values[j];
					if (nestedItem == null) continue;
					if (Object.hasOwnProperty.call(nestedItem, nestedKey)) {
						var nestedValue = nestedItem[nestedKey];
						if (nestedValue != null) {
							nestedValues.push(nestedValue);
						}
					} else if (nestedKey === '*') {
						nestedValues = nestedValues.concat(nestedItem);
					}
				}
				values = nestedValues;
			}
			if (Array.isArray(values[0])) {
				var result = [];
				return result.concat.apply(result, values);
			}
			return values;
		}
		function getAllValuesToRank(item, keys) {
			var allValues = [];
			for (var j = 0, J = keys.length; j < J; j++) {
				var key = keys[j];
				var attributes = getKeyAttributes(key);
				var itemValues = getItemValues(item, key);
				for (var i = 0, I = itemValues.length; i < I; i++) {
					allValues.push({
						itemValue: itemValues[i],
						attributes
					});
				}
			}
			return allValues;
		}
		var defaultKeyAttributes = {
			maxRanking: Infinity,
			minRanking: -Infinity
		};
		function getKeyAttributes(key) {
			if (typeof key === 'string') {
				return defaultKeyAttributes;
			}
			return _extends__default['default']({}, defaultKeyAttributes, key);
		}
		exports.defaultBaseSortFn = defaultBaseSortFn;
		exports.matchSorter = matchSorter2;
		exports.rankings = rankings;
	}
});

// .svelte-kit/vercel/entry.js
__export(exports, {
	default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();
function getRawBody(req) {
	return new Promise((fulfil, reject) => {
		const h = req.headers;
		if (!h['content-type']) {
			return fulfil(null);
		}
		req.on('error', reject);
		const length = Number(h['content-length']);
		if (isNaN(length) && h['transfer-encoding'] == null) {
			return fulfil(null);
		}
		let data = new Uint8Array(length || 0);
		if (length > 0) {
			let offset = 0;
			req.on('data', (chunk) => {
				const new_len = offset + Buffer.byteLength(chunk);
				if (new_len > length) {
					return reject({
						status: 413,
						reason: 'Exceeded "Content-Length" limit'
					});
				}
				data.set(chunk, offset);
				offset = new_len;
			});
		} else {
			req.on('data', (chunk) => {
				const new_data = new Uint8Array(data.length + chunk.length);
				new_data.set(data, 0);
				new_data.set(chunk, data.length);
				data = new_data;
			});
		}
		req.on('end', () => {
			fulfil(data);
		});
	});
}

// .svelte-kit/output/server/app.js
init_shims();
var import_match_sorter = __toModule(require_match_sorter_cjs());
var __accessCheck = (obj, member, msg) => {
	if (!member.has(obj)) throw TypeError('Cannot ' + msg);
};
var __privateGet = (obj, member, getter) => {
	__accessCheck(obj, member, 'read from private field');
	return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
	if (member.has(obj)) throw TypeError('Cannot add the same private member more than once');
	member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
	__accessCheck(obj, member, 'write to private field');
	setter ? setter.call(obj, value) : member.set(obj, value);
	return value;
};
var _map;
function get_single_valued_header(headers, key) {
	const value = headers[key];
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return void 0;
		}
		if (value.length > 1) {
			throw new Error(
				`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`
			);
		}
		return value[0];
	}
	return value;
}
function coalesce_to_error(err) {
	return err instanceof Error || (err && err.name && err.message)
		? err
		: new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
	const clone2 = {};
	for (const key in obj) {
		clone2[key.toLowerCase()] = obj[key];
	}
	return clone2;
}
function error$1(body) {
	return {
		status: 500,
		body,
		headers: {}
	};
}
function is_string(s2) {
	return typeof s2 === 'string' || s2 instanceof String;
}
function is_content_type_textual(content_type) {
	if (!content_type) return true;
	const [type] = content_type.split(';');
	return (
		type === 'text/plain' ||
		type === 'application/json' ||
		type === 'application/x-www-form-urlencoded' ||
		type === 'multipart/form-data'
	);
}
async function render_endpoint(request, route, match) {
	const mod = await route.load();
	const handler = mod[request.method.toLowerCase().replace('delete', 'del')];
	if (!handler) {
		return;
	}
	const params = route.params(match);
	const response = await handler({ ...request, params });
	const preface = `Invalid response from route ${request.path}`;
	if (!response) {
		return;
	}
	if (typeof response !== 'object') {
		return error$1(`${preface}: expected an object, got ${typeof response}`);
	}
	let { status = 200, body, headers = {} } = response;
	headers = lowercase_keys(headers);
	const type = get_single_valued_header(headers, 'content-type');
	const is_type_textual = is_content_type_textual(type);
	if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
		return error$1(
			`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`
		);
	}
	let normalized_body;
	if (
		(typeof body === 'object' || typeof body === 'undefined') &&
		!(body instanceof Uint8Array) &&
		(!type || type.startsWith('application/json'))
	) {
		headers = { ...headers, 'content-type': 'application/json; charset=utf-8' };
		normalized_body = JSON.stringify(typeof body === 'undefined' ? {} : body);
	} else {
		normalized_body = body;
	}
	return { status, body: normalized_body, headers };
}
var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved =
	/^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
	'<': '\\u003C',
	'>': '\\u003E',
	'/': '\\u002F',
	'\\': '\\\\',
	'\b': '\\b',
	'\f': '\\f',
	'\n': '\\n',
	'\r': '\\r',
	'	': '\\t',
	'\0': '\\0',
	'\u2028': '\\u2028',
	'\u2029': '\\u2029'
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');
function devalue(value) {
	var counts = new Map();
	function walk(thing) {
		if (typeof thing === 'function') {
			throw new Error('Cannot stringify a function');
		}
		if (counts.has(thing)) {
			counts.set(thing, counts.get(thing) + 1);
			return;
		}
		counts.set(thing, 1);
		if (!isPrimitive(thing)) {
			var type = getType(thing);
			switch (type) {
				case 'Number':
				case 'String':
				case 'Boolean':
				case 'Date':
				case 'RegExp':
					return;
				case 'Array':
					thing.forEach(walk);
					break;
				case 'Set':
				case 'Map':
					Array.from(thing).forEach(walk);
					break;
				default:
					var proto = Object.getPrototypeOf(thing);
					if (
						proto !== Object.prototype &&
						proto !== null &&
						Object.getOwnPropertyNames(proto).sort().join('\0') !== objectProtoOwnPropertyNames
					) {
						throw new Error('Cannot stringify arbitrary non-POJOs');
					}
					if (Object.getOwnPropertySymbols(thing).length > 0) {
						throw new Error('Cannot stringify POJOs with symbolic keys');
					}
					Object.keys(thing).forEach(function (key) {
						return walk(thing[key]);
					});
			}
		}
	}
	walk(value);
	var names = new Map();
	Array.from(counts)
		.filter(function (entry) {
			return entry[1] > 1;
		})
		.sort(function (a, b) {
			return b[1] - a[1];
		})
		.forEach(function (entry, i) {
			names.set(entry[0], getName(i));
		});
	function stringify(thing) {
		if (names.has(thing)) {
			return names.get(thing);
		}
		if (isPrimitive(thing)) {
			return stringifyPrimitive(thing);
		}
		var type = getType(thing);
		switch (type) {
			case 'Number':
			case 'String':
			case 'Boolean':
				return 'Object(' + stringify(thing.valueOf()) + ')';
			case 'RegExp':
				return 'new RegExp(' + stringifyString(thing.source) + ', "' + thing.flags + '")';
			case 'Date':
				return 'new Date(' + thing.getTime() + ')';
			case 'Array':
				var members = thing.map(function (v, i) {
					return i in thing ? stringify(v) : '';
				});
				var tail = thing.length === 0 || thing.length - 1 in thing ? '' : ',';
				return '[' + members.join(',') + tail + ']';
			case 'Set':
			case 'Map':
				return 'new ' + type + '([' + Array.from(thing).map(stringify).join(',') + '])';
			default:
				var obj =
					'{' +
					Object.keys(thing)
						.map(function (key) {
							return safeKey(key) + ':' + stringify(thing[key]);
						})
						.join(',') +
					'}';
				var proto = Object.getPrototypeOf(thing);
				if (proto === null) {
					return Object.keys(thing).length > 0
						? 'Object.assign(Object.create(null),' + obj + ')'
						: 'Object.create(null)';
				}
				return obj;
		}
	}
	var str = stringify(value);
	if (names.size) {
		var params_1 = [];
		var statements_1 = [];
		var values_1 = [];
		names.forEach(function (name, thing) {
			params_1.push(name);
			if (isPrimitive(thing)) {
				values_1.push(stringifyPrimitive(thing));
				return;
			}
			var type = getType(thing);
			switch (type) {
				case 'Number':
				case 'String':
				case 'Boolean':
					values_1.push('Object(' + stringify(thing.valueOf()) + ')');
					break;
				case 'RegExp':
					values_1.push(thing.toString());
					break;
				case 'Date':
					values_1.push('new Date(' + thing.getTime() + ')');
					break;
				case 'Array':
					values_1.push('Array(' + thing.length + ')');
					thing.forEach(function (v, i) {
						statements_1.push(name + '[' + i + ']=' + stringify(v));
					});
					break;
				case 'Set':
					values_1.push('new Set');
					statements_1.push(
						name +
							'.' +
							Array.from(thing)
								.map(function (v) {
									return 'add(' + stringify(v) + ')';
								})
								.join('.')
					);
					break;
				case 'Map':
					values_1.push('new Map');
					statements_1.push(
						name +
							'.' +
							Array.from(thing)
								.map(function (_a) {
									var k = _a[0],
										v = _a[1];
									return 'set(' + stringify(k) + ', ' + stringify(v) + ')';
								})
								.join('.')
					);
					break;
				default:
					values_1.push(Object.getPrototypeOf(thing) === null ? 'Object.create(null)' : '{}');
					Object.keys(thing).forEach(function (key) {
						statements_1.push('' + name + safeProp(key) + '=' + stringify(thing[key]));
					});
			}
		});
		statements_1.push('return ' + str);
		return (
			'(function(' +
			params_1.join(',') +
			'){' +
			statements_1.join(';') +
			'}(' +
			values_1.join(',') +
			'))'
		);
	} else {
		return str;
	}
}
function getName(num) {
	var name = '';
	do {
		name = chars[num % chars.length] + name;
		num = ~~(num / chars.length) - 1;
	} while (num >= 0);
	return reserved.test(name) ? name + '_' : name;
}
function isPrimitive(thing) {
	return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
	if (typeof thing === 'string') return stringifyString(thing);
	if (thing === void 0) return 'void 0';
	if (thing === 0 && 1 / thing < 0) return '-0';
	var str = String(thing);
	if (typeof thing === 'number') return str.replace(/^(-)?0\./, '$1.');
	return str;
}
function getType(thing) {
	return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
	return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
	return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key)
		? '.' + key
		: '[' + escapeUnsafeChars(JSON.stringify(key)) + ']';
}
function stringifyString(str) {
	var result = '"';
	for (var i = 0; i < str.length; i += 1) {
		var char = str.charAt(i);
		var code = char.charCodeAt(0);
		if (char === '"') {
			result += '\\"';
		} else if (char in escaped$1) {
			result += escaped$1[char];
		} else if (code >= 55296 && code <= 57343) {
			var next = str.charCodeAt(i + 1);
			if (code <= 56319 && next >= 56320 && next <= 57343) {
				result += char + str[++i];
			} else {
				result += '\\u' + code.toString(16).toUpperCase();
			}
		} else {
			result += char;
		}
	}
	result += '"';
	return result;
}
function noop$1() {}
function safe_not_equal$1(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}
Promise.resolve();
var subscriber_queue$1 = [];
function writable$1(value, start = noop$1) {
	let stop;
	const subscribers = new Set();
	function set(new_value) {
		if (safe_not_equal$1(value, new_value)) {
			value = new_value;
			if (stop) {
				const run_queue = !subscriber_queue$1.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue$1.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue$1.length; i += 2) {
						subscriber_queue$1[i][0](subscriber_queue$1[i + 1]);
					}
					subscriber_queue$1.length = 0;
				}
			}
		}
	}
	function update(fn) {
		set(fn(value));
	}
	function subscribe2(run2, invalidate = noop$1) {
		const subscriber = [run2, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) {
			stop = start(set) || noop$1;
		}
		run2(value);
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0) {
				stop();
				stop = null;
			}
		};
	}
	return { set, update, subscribe: subscribe2 };
}
function hash(value) {
	let hash2 = 5381;
	let i = value.length;
	if (typeof value === 'string') {
		while (i) hash2 = (hash2 * 33) ^ value.charCodeAt(--i);
	} else {
		while (i) hash2 = (hash2 * 33) ^ value[--i];
	}
	return (hash2 >>> 0).toString(36);
}
var escape_json_string_in_html_dict = {
	'"': '\\"',
	'<': '\\u003C',
	'>': '\\u003E',
	'/': '\\u002F',
	'\\': '\\\\',
	'\b': '\\b',
	'\f': '\\f',
	'\n': '\\n',
	'\r': '\\r',
	'	': '\\t',
	'\0': '\\0',
	'\u2028': '\\u2028',
	'\u2029': '\\u2029'
};
function escape_json_string_in_html(str) {
	return escape$1(
		str,
		escape_json_string_in_html_dict,
		(code) => `\\u${code.toString(16).toUpperCase()}`
	);
}
var escape_html_attr_dict = {
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;'
};
function escape_html_attr(str) {
	return '"' + escape$1(str, escape_html_attr_dict, (code) => `&#${code};`) + '"';
}
function escape$1(str, dict, unicode_encoder) {
	let result = '';
	for (let i = 0; i < str.length; i += 1) {
		const char = str.charAt(i);
		const code = char.charCodeAt(0);
		if (char in dict) {
			result += dict[char];
		} else if (code >= 55296 && code <= 57343) {
			const next = str.charCodeAt(i + 1);
			if (code <= 56319 && next >= 56320 && next <= 57343) {
				result += char + str[++i];
			} else {
				result += unicode_encoder(code);
			}
		} else {
			result += char;
		}
	}
	return result;
}
var s$1 = JSON.stringify;
async function render_response({
	branch,
	options: options2,
	$session,
	page_config,
	status,
	error: error2,
	page
}) {
	const css2 = new Set(options2.entry.css);
	const js = new Set(options2.entry.js);
	const styles = new Set();
	const serialized_data = [];
	let rendered;
	let is_private = false;
	let maxage;
	if (error2) {
		error2.stack = options2.get_stack(error2);
	}
	if (page_config.ssr) {
		branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
			if (node.css) node.css.forEach((url) => css2.add(url));
			if (node.js) node.js.forEach((url) => js.add(url));
			if (node.styles) node.styles.forEach((content) => styles.add(content));
			if (fetched && page_config.hydrate) serialized_data.push(...fetched);
			if (uses_credentials) is_private = true;
			maxage = loaded.maxage;
		});
		const session = writable$1($session);
		const props = {
			stores: {
				page: writable$1(null),
				navigating: writable$1(null),
				session
			},
			page,
			components: branch.map(({ node }) => node.module.default)
		};
		for (let i = 0; i < branch.length; i += 1) {
			props[`props_${i}`] = await branch[i].loaded.props;
		}
		let session_tracking_active = false;
		const unsubscribe = session.subscribe(() => {
			if (session_tracking_active) is_private = true;
		});
		session_tracking_active = true;
		try {
			rendered = options2.root.render(props);
		} finally {
			unsubscribe();
		}
	} else {
		rendered = { head: '', html: '', css: { code: '', map: null } };
	}
	const include_js = page_config.router || page_config.hydrate;
	if (!include_js) js.clear();
	const links = options2.amp
		? styles.size > 0 || rendered.css.code.length > 0
			? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join('\n')}</style>`
			: ''
		: [
				...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
				...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
		  ].join('\n		');
	let init2 = '';
	if (options2.amp) {
		init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
	} else if (include_js) {
		init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : 'document.body'},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
					throw new Error(`Failed to serialize session data: ${error3.message}`);
				})},
				host: ${page && page.host ? s$1(page.host) : 'location.host'},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${
					page_config.ssr && page_config.hydrate
						? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(',\n						')}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : 'location.host'}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ''}),
						params: ${page && s$1(page.params)}
					}
				}`
						: 'null'
				}
			});
		<\/script>`;
	}
	if (options2.service_worker) {
		init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
	}
	const head = [
		rendered.head,
		styles.size && !options2.amp
			? `<style data-svelte>${Array.from(styles).join('\n')}</style>`
			: '',
		links,
		init2
	].join('\n\n		');
	const body = options2.amp
		? rendered.html
		: `${rendered.html}

			${serialized_data
				.map(({ url, body: body2, json }) => {
					let attributes = `type="application/json" data-type="svelte-data" data-url=${escape_html_attr(
						url
					)}`;
					if (body2) attributes += ` data-body="${hash(body2)}"`;
					return `<script ${attributes}>${json}<\/script>`;
				})
				.join('\n\n	')}
		`;
	const headers = {
		'content-type': 'text/html'
	};
	if (maxage) {
		headers['cache-control'] = `${is_private ? 'private' : 'public'}, max-age=${maxage}`;
	}
	if (!options2.floc) {
		headers['permissions-policy'] = 'interest-cohort=()';
	}
	return {
		status,
		headers,
		body: options2.template({ head, body })
	};
}
function try_serialize(data, fail) {
	try {
		return devalue(data);
	} catch (err) {
		if (fail) fail(coalesce_to_error(err));
		return null;
	}
}
function serialize_error(error2) {
	if (!error2) return null;
	let serialized = try_serialize(error2);
	if (!serialized) {
		const { name, message, stack } = error2;
		serialized = try_serialize({ ...error2, name, message, stack });
	}
	if (!serialized) {
		serialized = '{}';
	}
	return serialized;
}
function normalize(loaded) {
	const has_error_status =
		loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
	if (loaded.error || has_error_status) {
		const status = loaded.status;
		if (!loaded.error && has_error_status) {
			return {
				status: status || 500,
				error: new Error()
			};
		}
		const error2 = typeof loaded.error === 'string' ? new Error(loaded.error) : loaded.error;
		if (!(error2 instanceof Error)) {
			return {
				status: 500,
				error: new Error(
					`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`
				)
			};
		}
		if (!status || status < 400 || status > 599) {
			console.warn(
				'"error" returned from load() without a valid status code \u2014 defaulting to 500'
			);
			return { status: 500, error: error2 };
		}
		return { status, error: error2 };
	}
	if (loaded.redirect) {
		if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
			return {
				status: 500,
				error: new Error(
					'"redirect" property returned from load() must be accompanied by a 3xx status code'
				)
			};
		}
		if (typeof loaded.redirect !== 'string') {
			return {
				status: 500,
				error: new Error('"redirect" property returned from load() must be a string')
			};
		}
	}
	if (loaded.context) {
		throw new Error(
			'You are returning "context" from a load function. "context" was renamed to "stuff", please adjust your code accordingly.'
		);
	}
	return loaded;
}
var s = JSON.stringify;
async function load_node({
	request,
	options: options2,
	state,
	route,
	page,
	node,
	$session,
	stuff,
	prerender_enabled,
	is_leaf,
	is_error,
	status,
	error: error2
}) {
	const { module: module2 } = node;
	let uses_credentials = false;
	const fetched = [];
	let set_cookie_headers = [];
	let loaded;
	const page_proxy = new Proxy(page, {
		get: (target, prop, receiver) => {
			if (prop === 'query' && prerender_enabled) {
				throw new Error('Cannot access query on a page with prerendering enabled');
			}
			return Reflect.get(target, prop, receiver);
		}
	});
	if (module2.load) {
		const load_input = {
			page: page_proxy,
			get session() {
				uses_credentials = true;
				return $session;
			},
			fetch: async (resource, opts = {}) => {
				let url;
				if (typeof resource === 'string') {
					url = resource;
				} else {
					url = resource.url;
					opts = {
						method: resource.method,
						headers: resource.headers,
						body: resource.body,
						mode: resource.mode,
						credentials: resource.credentials,
						cache: resource.cache,
						redirect: resource.redirect,
						referrer: resource.referrer,
						integrity: resource.integrity,
						...opts
					};
				}
				const resolved = resolve(request.path, url.split('?')[0]);
				let response;
				const filename = resolved.replace(options2.paths.assets, '').slice(1);
				const filename_html = `${filename}/index.html`;
				const asset = options2.manifest.assets.find(
					(d) => d.file === filename || d.file === filename_html
				);
				if (asset) {
					response = options2.read
						? new Response(options2.read(asset.file), {
								headers: asset.type ? { 'content-type': asset.type } : {}
						  })
						: await fetch(`http://${page.host}/${asset.file}`, opts);
				} else if (resolved.startsWith('/') && !resolved.startsWith('//')) {
					const relative = resolved;
					const headers = {
						...opts.headers
					};
					if (opts.credentials !== 'omit') {
						uses_credentials = true;
						headers.cookie = request.headers.cookie;
						if (!headers.authorization) {
							headers.authorization = request.headers.authorization;
						}
					}
					if (opts.body && typeof opts.body !== 'string') {
						throw new Error('Request body must be a string');
					}
					const search = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
					const rendered = await respond(
						{
							host: request.host,
							method: opts.method || 'GET',
							headers,
							path: relative,
							rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
							query: new URLSearchParams(search)
						},
						options2,
						{
							fetched: url,
							initiator: route
						}
					);
					if (rendered) {
						if (state.prerender) {
							state.prerender.dependencies.set(relative, rendered);
						}
						response = new Response(rendered.body, {
							status: rendered.status,
							headers: rendered.headers
						});
					}
				} else {
					if (resolved.startsWith('//')) {
						throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
					}
					if (typeof request.host !== 'undefined') {
						const { hostname: fetch_hostname } = new URL(url);
						const [server_hostname] = request.host.split(':');
						if (
							`.${fetch_hostname}`.endsWith(`.${server_hostname}`) &&
							opts.credentials !== 'omit'
						) {
							uses_credentials = true;
							opts.headers = {
								...opts.headers,
								cookie: request.headers.cookie
							};
						}
					}
					const external_request = new Request(url, opts);
					response = await options2.hooks.externalFetch.call(null, external_request);
				}
				if (response) {
					const proxy = new Proxy(response, {
						get(response2, key, receiver) {
							async function text() {
								const body = await response2.text();
								const headers = {};
								for (const [key2, value] of response2.headers) {
									if (key2 === 'set-cookie') {
										set_cookie_headers = set_cookie_headers.concat(value);
									} else if (key2 !== 'etag') {
										headers[key2] = value;
									}
								}
								if (!opts.body || typeof opts.body === 'string') {
									fetched.push({
										url,
										body: opts.body,
										json: `{"status":${response2.status},"statusText":${s(
											response2.statusText
										)},"headers":${s(headers)},"body":"${escape_json_string_in_html(body)}"}`
									});
								}
								return body;
							}
							if (key === 'text') {
								return text;
							}
							if (key === 'json') {
								return async () => {
									return JSON.parse(await text());
								};
							}
							return Reflect.get(response2, key, response2);
						}
					});
					return proxy;
				}
				return (
					response ||
					new Response('Not found', {
						status: 404
					})
				);
			},
			stuff: { ...stuff }
		};
		if (is_error) {
			load_input.status = status;
			load_input.error = error2;
		}
		loaded = await module2.load.call(null, load_input);
	} else {
		loaded = {};
	}
	if (!loaded && is_leaf && !is_error) return;
	if (!loaded) {
		throw new Error(`${node.entry} - load must return a value except for page fall through`);
	}
	return {
		node,
		loaded: normalize(loaded),
		stuff: loaded.stuff || stuff,
		fetched,
		set_cookie_headers,
		uses_credentials
	};
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
	const base_match = absolute.exec(base2);
	const path_match = absolute.exec(path);
	if (!base_match) {
		throw new Error(`bad base path: "${base2}"`);
	}
	const baseparts = path_match ? [] : base2.slice(base_match[0].length).split('/');
	const pathparts = path_match ? path.slice(path_match[0].length).split('/') : path.split('/');
	baseparts.pop();
	for (let i = 0; i < pathparts.length; i += 1) {
		const part = pathparts[i];
		if (part === '.') continue;
		else if (part === '..') baseparts.pop();
		else baseparts.push(part);
	}
	const prefix = (path_match && path_match[0]) || (base_match && base_match[0]) || '';
	return `${prefix}${baseparts.join('/')}`;
}
async function respond_with_error({
	request,
	options: options2,
	state,
	$session,
	status,
	error: error2
}) {
	const default_layout = await options2.load_component(options2.manifest.layout);
	const default_error = await options2.load_component(options2.manifest.error);
	const page = {
		host: request.host,
		path: request.path,
		query: request.query,
		params: {}
	};
	const loaded = await load_node({
		request,
		options: options2,
		state,
		route: null,
		page,
		node: default_layout,
		$session,
		stuff: {},
		prerender_enabled: is_prerender_enabled(options2, default_error, state),
		is_leaf: false,
		is_error: false
	});
	const branch = [
		loaded,
		await load_node({
			request,
			options: options2,
			state,
			route: null,
			page,
			node: default_error,
			$session,
			stuff: loaded ? loaded.stuff : {},
			prerender_enabled: is_prerender_enabled(options2, default_error, state),
			is_leaf: false,
			is_error: true,
			status,
			error: error2
		})
	];
	try {
		return await render_response({
			options: options2,
			$session,
			page_config: {
				hydrate: options2.hydrate,
				router: options2.router,
				ssr: options2.ssr
			},
			status,
			error: error2,
			branch,
			page
		});
	} catch (err) {
		const error3 = coalesce_to_error(err);
		options2.handle_error(error3, request);
		return {
			status: 500,
			headers: {},
			body: error3.stack
		};
	}
}
function is_prerender_enabled(options2, node, state) {
	return (
		options2.prerender && (!!node.module.prerender || (!!state.prerender && state.prerender.all))
	);
}
async function respond$1(opts) {
	const { request, options: options2, state, $session, route } = opts;
	let nodes;
	try {
		nodes = await Promise.all(route.a.map((id) => (id ? options2.load_component(id) : void 0)));
	} catch (err) {
		const error3 = coalesce_to_error(err);
		options2.handle_error(error3, request);
		return await respond_with_error({
			request,
			options: options2,
			state,
			$session,
			status: 500,
			error: error3
		});
	}
	const leaf = nodes[nodes.length - 1].module;
	let page_config = get_page_config(leaf, options2);
	if (!leaf.prerender && state.prerender && !state.prerender.all) {
		return {
			status: 204,
			headers: {},
			body: ''
		};
	}
	let branch = [];
	let status = 200;
	let error2;
	let set_cookie_headers = [];
	ssr: if (page_config.ssr) {
		let stuff = {};
		for (let i = 0; i < nodes.length; i += 1) {
			const node = nodes[i];
			let loaded;
			if (node) {
				try {
					loaded = await load_node({
						...opts,
						node,
						stuff,
						prerender_enabled: is_prerender_enabled(options2, node, state),
						is_leaf: i === nodes.length - 1,
						is_error: false
					});
					if (!loaded) return;
					set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
					if (loaded.loaded.redirect) {
						return with_cookies(
							{
								status: loaded.loaded.status,
								headers: {
									location: encodeURI(loaded.loaded.redirect)
								}
							},
							set_cookie_headers
						);
					}
					if (loaded.loaded.error) {
						({ status, error: error2 } = loaded.loaded);
					}
				} catch (err) {
					const e = coalesce_to_error(err);
					options2.handle_error(e, request);
					status = 500;
					error2 = e;
				}
				if (loaded && !error2) {
					branch.push(loaded);
				}
				if (error2) {
					while (i--) {
						if (route.b[i]) {
							const error_node = await options2.load_component(route.b[i]);
							let node_loaded;
							let j = i;
							while (!(node_loaded = branch[j])) {
								j -= 1;
							}
							try {
								const error_loaded = await load_node({
									...opts,
									node: error_node,
									stuff: node_loaded.stuff,
									prerender_enabled: is_prerender_enabled(options2, error_node, state),
									is_leaf: false,
									is_error: true,
									status,
									error: error2
								});
								if (error_loaded.loaded.error) {
									continue;
								}
								page_config = get_page_config(error_node.module, options2);
								branch = branch.slice(0, j + 1).concat(error_loaded);
								break ssr;
							} catch (err) {
								const e = coalesce_to_error(err);
								options2.handle_error(e, request);
								continue;
							}
						}
					}
					return with_cookies(
						await respond_with_error({
							request,
							options: options2,
							state,
							$session,
							status,
							error: error2
						}),
						set_cookie_headers
					);
				}
			}
			if (loaded && loaded.loaded.stuff) {
				stuff = {
					...stuff,
					...loaded.loaded.stuff
				};
			}
		}
	}
	try {
		return with_cookies(
			await render_response({
				...opts,
				page_config,
				status,
				error: error2,
				branch: branch.filter(Boolean)
			}),
			set_cookie_headers
		);
	} catch (err) {
		const error3 = coalesce_to_error(err);
		options2.handle_error(error3, request);
		return with_cookies(
			await respond_with_error({
				...opts,
				status: 500,
				error: error3
			}),
			set_cookie_headers
		);
	}
}
function get_page_config(leaf, options2) {
	return {
		ssr: 'ssr' in leaf ? !!leaf.ssr : options2.ssr,
		router: 'router' in leaf ? !!leaf.router : options2.router,
		hydrate: 'hydrate' in leaf ? !!leaf.hydrate : options2.hydrate
	};
}
function with_cookies(response, set_cookie_headers) {
	if (set_cookie_headers.length) {
		response.headers['set-cookie'] = set_cookie_headers;
	}
	return response;
}
async function render_page(request, route, match, options2, state) {
	if (state.initiator === route) {
		return {
			status: 404,
			headers: {},
			body: `Not found: ${request.path}`
		};
	}
	const params = route.params(match);
	const page = {
		host: request.host,
		path: request.path,
		query: request.query,
		params
	};
	const $session = await options2.hooks.getSession(request);
	const response = await respond$1({
		request,
		options: options2,
		state,
		$session,
		route,
		page
	});
	if (response) {
		return response;
	}
	if (state.fetched) {
		return {
			status: 500,
			headers: {},
			body: `Bad request in load function: failed to fetch ${state.fetched}`
		};
	}
}
function read_only_form_data() {
	const map = new Map();
	return {
		append(key, value) {
			if (map.has(key)) {
				(map.get(key) || []).push(value);
			} else {
				map.set(key, [value]);
			}
		},
		data: new ReadOnlyFormData(map)
	};
}
var ReadOnlyFormData = class {
	constructor(map) {
		__privateAdd(this, _map, void 0);
		__privateSet(this, _map, map);
	}
	get(key) {
		const value = __privateGet(this, _map).get(key);
		return value && value[0];
	}
	getAll(key) {
		return __privateGet(this, _map).get(key);
	}
	has(key) {
		return __privateGet(this, _map).has(key);
	}
	*[Symbol.iterator]() {
		for (const [key, value] of __privateGet(this, _map)) {
			for (let i = 0; i < value.length; i += 1) {
				yield [key, value[i]];
			}
		}
	}
	*entries() {
		for (const [key, value] of __privateGet(this, _map)) {
			for (let i = 0; i < value.length; i += 1) {
				yield [key, value[i]];
			}
		}
	}
	*keys() {
		for (const [key] of __privateGet(this, _map)) yield key;
	}
	*values() {
		for (const [, value] of __privateGet(this, _map)) {
			for (let i = 0; i < value.length; i += 1) {
				yield value[i];
			}
		}
	}
};
_map = new WeakMap();
function parse_body(raw, headers) {
	if (!raw) return raw;
	const content_type = headers['content-type'];
	const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
	const text = () => new TextDecoder(headers['content-encoding'] || 'utf-8').decode(raw);
	switch (type) {
		case 'text/plain':
			return text();
		case 'application/json':
			return JSON.parse(text());
		case 'application/x-www-form-urlencoded':
			return get_urlencoded(text());
		case 'multipart/form-data': {
			const boundary = directives.find((directive) => directive.startsWith('boundary='));
			if (!boundary) throw new Error('Missing boundary');
			return get_multipart(text(), boundary.slice('boundary='.length));
		}
		default:
			return raw;
	}
}
function get_urlencoded(text) {
	const { data, append } = read_only_form_data();
	text
		.replace(/\+/g, ' ')
		.split('&')
		.forEach((str) => {
			const [key, value] = str.split('=');
			append(decodeURIComponent(key), decodeURIComponent(value));
		});
	return data;
}
function get_multipart(text, boundary) {
	const parts = text.split(`--${boundary}`);
	if (parts[0] !== '' || parts[parts.length - 1].trim() !== '--') {
		throw new Error('Malformed form data');
	}
	const { data, append } = read_only_form_data();
	parts.slice(1, -1).forEach((part) => {
		const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
		if (!match) {
			throw new Error('Malformed form data');
		}
		const raw_headers = match[1];
		const body = match[2].trim();
		let key;
		const headers = {};
		raw_headers.split('\r\n').forEach((str) => {
			const [raw_header, ...raw_directives] = str.split('; ');
			let [name, value] = raw_header.split(': ');
			name = name.toLowerCase();
			headers[name] = value;
			const directives = {};
			raw_directives.forEach((raw_directive) => {
				const [name2, value2] = raw_directive.split('=');
				directives[name2] = JSON.parse(value2);
			});
			if (name === 'content-disposition') {
				if (value !== 'form-data') throw new Error('Malformed form data');
				if (directives.filename) {
					throw new Error('File upload is not yet implemented');
				}
				if (directives.name) {
					key = directives.name;
				}
			}
		});
		if (!key) throw new Error('Malformed form data');
		append(key, body);
	});
	return data;
}
async function respond(incoming, options2, state = {}) {
	if (incoming.path !== '/' && options2.trailing_slash !== 'ignore') {
		const has_trailing_slash = incoming.path.endsWith('/');
		if (
			(has_trailing_slash && options2.trailing_slash === 'never') ||
			(!has_trailing_slash &&
				options2.trailing_slash === 'always' &&
				!(incoming.path.split('/').pop() || '').includes('.'))
		) {
			const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + '/';
			const q = incoming.query.toString();
			return {
				status: 301,
				headers: {
					location: options2.paths.base + path + (q ? `?${q}` : '')
				}
			};
		}
	}
	const headers = lowercase_keys(incoming.headers);
	const request = {
		...incoming,
		headers,
		body: parse_body(incoming.rawBody, headers),
		params: {},
		locals: {}
	};
	try {
		return await options2.hooks.handle({
			request,
			resolve: async (request2) => {
				if (state.prerender && state.prerender.fallback) {
					return await render_response({
						options: options2,
						$session: await options2.hooks.getSession(request2),
						page_config: { ssr: false, router: true, hydrate: true },
						status: 200,
						branch: []
					});
				}
				const decoded = decodeURI(request2.path);
				for (const route of options2.manifest.routes) {
					const match = route.pattern.exec(decoded);
					if (!match) continue;
					const response =
						route.type === 'endpoint'
							? await render_endpoint(request2, route, match)
							: await render_page(request2, route, match, options2, state);
					if (response) {
						if (response.status === 200) {
							const cache_control = get_single_valued_header(response.headers, 'cache-control');
							if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
								const etag = `"${hash(response.body || '')}"`;
								if (request2.headers['if-none-match'] === etag) {
									return {
										status: 304,
										headers: {},
										body: ''
									};
								}
								response.headers['etag'] = etag;
							}
						}
						return response;
					}
				}
				const $session = await options2.hooks.getSession(request2);
				return await respond_with_error({
					request: request2,
					options: options2,
					state,
					$session,
					status: 404,
					error: new Error(`Not found: ${request2.path}`)
				});
			}
		});
	} catch (err) {
		const e = coalesce_to_error(err);
		options2.handle_error(e, request);
		return {
			status: 500,
			headers: {},
			body: options2.dev ? e.stack : e.message
		};
	}
}
function noop() {}
var identity = (x) => x;
function run(fn) {
	return fn();
}
function blank_object() {
	return Object.create(null);
}
function run_all(fns) {
	fns.forEach(run);
}
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}
function subscribe(store, ...callbacks) {
	if (store == null) {
		return noop;
	}
	const unsub = store.subscribe(...callbacks);
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function null_to_empty(value) {
	return value == null ? '' : value;
}
function custom_event(type, detail, bubbles = false) {
	const e = document.createEvent('CustomEvent');
	e.initCustomEvent(type, bubbles, false, detail);
	return e;
}
var current_component;
function set_current_component(component) {
	current_component = component;
}
function get_current_component() {
	if (!current_component) throw new Error('Function called outside component initialization');
	return current_component;
}
function onDestroy(fn) {
	get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
	const component = get_current_component();
	return (type, detail) => {
		const callbacks = component.$$.callbacks[type];
		if (callbacks) {
			const event = custom_event(type, detail);
			callbacks.slice().forEach((fn) => {
				fn.call(component, event);
			});
		}
	};
}
function setContext(key, context) {
	get_current_component().$$.context.set(key, context);
}
Promise.resolve();
var escaped = {
	'"': '&quot;',
	"'": '&#39;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;'
};
function escape(html) {
	return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
	let str = '';
	for (let i = 0; i < items.length; i += 1) {
		str += fn(items[i], i);
	}
	return str;
}
var missing_component = {
	$$render: () => ''
};
function validate_component(component, name) {
	if (!component || !component.$$render) {
		if (name === 'svelte:component') name += ' this={...}';
		throw new Error(
			`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`
		);
	}
	return component;
}
var on_destroy;
function create_ssr_component(fn) {
	function $$render(result, props, bindings, slots, context) {
		const parent_component = current_component;
		const $$ = {
			on_destroy,
			context: new Map(context || (parent_component ? parent_component.$$.context : [])),
			on_mount: [],
			before_update: [],
			after_update: [],
			callbacks: blank_object()
		};
		set_current_component({ $$ });
		const html = fn(result, props, bindings, slots);
		set_current_component(parent_component);
		return html;
	}
	return {
		render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
			on_destroy = [];
			const result = { title: '', head: '', css: new Set() };
			const html = $$render(result, props, {}, $$slots, context);
			run_all(on_destroy);
			return {
				html,
				css: {
					code: Array.from(result.css)
						.map((css2) => css2.code)
						.join('\n'),
					map: null
				},
				head: result.title + result.head
			};
		},
		$$render
	};
}
function add_attribute(name, value, boolean) {
	if (value == null || (boolean && !value)) return '';
	return ` ${name}${
		value === true
			? ''
			: `=${typeof value === 'string' ? JSON.stringify(escape(value)) : `"${value}"`}`
	}`;
}
function afterUpdate() {}
var css$4 = {
	code: '#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}',
	map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let { stores } = $$props;
	let { page } = $$props;
	let { components } = $$props;
	let { props_0 = null } = $$props;
	let { props_1 = null } = $$props;
	let { props_2 = null } = $$props;
	setContext('__svelte__', stores);
	afterUpdate(stores.page.notify);
	if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
		$$bindings.stores(stores);
	if ($$props.page === void 0 && $$bindings.page && page !== void 0) $$bindings.page(page);
	if ($$props.components === void 0 && $$bindings.components && components !== void 0)
		$$bindings.components(components);
	if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
		$$bindings.props_0(props_0);
	if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
		$$bindings.props_1(props_1);
	if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
		$$bindings.props_2(props_2);
	$$result.css.add(css$4);
	{
		stores.page.set(page);
	}
	return `


${validate_component(components[0] || missing_component, 'svelte:component').$$render(
	$$result,
	Object.assign(props_0 || {}),
	{},
	{
		default: () =>
			`${
				components[1]
					? `${validate_component(components[1] || missing_component, 'svelte:component').$$render(
							$$result,
							Object.assign(props_1 || {}),
							{},
							{
								default: () =>
									`${
										components[2]
											? `${validate_component(
													components[2] || missing_component,
													'svelte:component'
											  ).$$render($$result, Object.assign(props_2 || {}), {}, {})}`
											: ``
									}`
							}
					  )}`
					: ``
			}`
	}
)}

${``}`;
});
var base = '';
var assets = '';
function set_paths(paths) {
	base = paths.base;
	assets = paths.assets || base;
}
function set_prerendering(value) {}
var user_hooks = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	[Symbol.toStringTag]: 'Module'
});
var template = ({ head, body }) =>
	'<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' +
	head +
	'\n	</head>\n	<body>\n		<div id="svelte">' +
	body +
	'</div>\n	</body>\n</html>\n';
var options = null;
var default_settings = { paths: { base: '', assets: '' } };
function init(settings = default_settings) {
	set_paths(settings.paths);
	set_prerendering(settings.prerendering || false);
	const hooks = get_hooks(user_hooks);
	options = {
		amp: false,
		dev: false,
		entry: {
			file: assets + '/_app/start-765d619c.js',
			css: [assets + '/_app/assets/start-61d1577b.css'],
			js: [assets + '/_app/start-765d619c.js', assets + '/_app/chunks/vendor-98592d0c.js']
		},
		fetched: void 0,
		floc: false,
		get_component_path: (id) => assets + '/_app/' + entry_lookup[id],
		get_stack: (error2) => String(error2),
		handle_error: (error2, request) => {
			hooks.handleError({ error: error2, request });
			error2.stack = options.get_stack(error2);
		},
		hooks,
		hydrate: true,
		initiator: void 0,
		load_component,
		manifest,
		paths: settings.paths,
		prerender: true,
		read: settings.read,
		root: Root,
		service_worker: null,
		router: true,
		ssr: true,
		target: '#svelte',
		template,
		trailing_slash: 'never'
	};
}
var empty = () => ({});
var manifest = {
	assets: [{ file: 'favicon.png', size: 1571, type: 'image/png' }],
	layout: '.svelte-kit/build/components/layout.svelte',
	error: '.svelte-kit/build/components/error.svelte',
	routes: [
		{
			type: 'page',
			pattern: /^\/$/,
			params: empty,
			a: ['.svelte-kit/build/components/layout.svelte', 'src/routes/index.svelte'],
			b: ['.svelte-kit/build/components/error.svelte']
		}
	]
};
var get_hooks = (hooks) => ({
	getSession: hooks.getSession || (() => ({})),
	handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
	handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
	externalFetch: hooks.externalFetch || fetch
});
var module_lookup = {
	'.svelte-kit/build/components/layout.svelte': () =>
		Promise.resolve().then(function () {
			return layout;
		}),
	'.svelte-kit/build/components/error.svelte': () =>
		Promise.resolve().then(function () {
			return error;
		}),
	'src/routes/index.svelte': () =>
		Promise.resolve().then(function () {
			return index;
		})
};
var metadata_lookup = {
	'.svelte-kit/build/components/layout.svelte': {
		entry: 'layout.svelte-491aa016.js',
		css: [],
		js: ['layout.svelte-491aa016.js', 'chunks/vendor-98592d0c.js'],
		styles: []
	},
	'.svelte-kit/build/components/error.svelte': {
		entry: 'error.svelte-fbee9051.js',
		css: [],
		js: ['error.svelte-fbee9051.js', 'chunks/vendor-98592d0c.js'],
		styles: []
	},
	'src/routes/index.svelte': {
		entry: 'pages/index.svelte-4483f776.js',
		css: ['assets/pages/index.svelte-e23fdcdb.css'],
		js: ['pages/index.svelte-4483f776.js', 'chunks/vendor-98592d0c.js'],
		styles: []
	}
};
async function load_component(file) {
	const { entry, css: css2, js, styles } = metadata_lookup[file];
	return {
		module: await module_lookup[file](),
		entry: assets + '/_app/' + entry,
		css: css2.map((dep) => assets + '/_app/' + dep),
		js: js.map((dep) => assets + '/_app/' + dep),
		styles
	};
}
function render(request, { prerender } = {}) {
	const host = request.headers['host'];
	return respond({ ...request, host }, options, { prerender });
}
var Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	return `${slots.default ? slots.default({}) : ``}`;
});
var layout = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	[Symbol.toStringTag]: 'Module',
	default: Layout
});
function load({ error: error2, status }) {
	return { props: { error: error2, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let { status } = $$props;
	let { error: error2 } = $$props;
	if ($$props.status === void 0 && $$bindings.status && status !== void 0)
		$$bindings.status(status);
	if ($$props.error === void 0 && $$bindings.error && error2 !== void 0) $$bindings.error(error2);
	return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	[Symbol.toStringTag]: 'Module',
	default: Error$1,
	load
});
function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
	const o = +getComputedStyle(node).opacity;
	return {
		delay,
		duration,
		easing,
		css: (t) => `opacity: ${t * o}`
	};
}
var Portal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let { target = 'body' } = $$props;
	if ($$props.target === void 0 && $$bindings.target && target !== void 0)
		$$bindings.target(target);
	return `<div hidden>${slots.default ? slots.default({}) : ``}</div>`;
});
var subscriber_queue = [];
function writable(value, start = noop) {
	let stop;
	const subscribers = new Set();
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (stop) {
				const run_queue = !subscriber_queue.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) {
						subscriber_queue[i][0](subscriber_queue[i + 1]);
					}
					subscriber_queue.length = 0;
				}
			}
		}
	}
	function update(fn) {
		set(fn(value));
	}
	function subscribe2(run2, invalidate = noop) {
		const subscriber = [run2, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) {
			stop = start(set) || noop;
		}
		run2(value);
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0) {
				stop();
				stop = null;
			}
		};
	}
	return { set, update, subscribe: subscribe2 };
}
var kbarInitialState = {
	search: '',
	actions: {},
	currentRootActionId: null,
	visible: false
};
var kbarWritable = writable(kbarInitialState);
var kbarStore = {
	subscribe: kbarWritable.subscribe,
	setVisible: (visible) => {
		kbarWritable.update((state) => {
			return {
				...state,
				visible
			};
		});
	},
	show: () => {
		kbarWritable.update((state) => {
			return {
				...state,
				visible: true
			};
		});
	},
	hide: () => {
		kbarWritable.update((state) => {
			return {
				...state,
				visible: false
			};
		});
	},
	setCurrentRootAction: (actionId) => {
		kbarWritable.update((state) => ({
			...state,
			currentRootActionId: actionId
		}));
	},
	setSearch: (search) => {
		kbarWritable.update((state) => {
			return {
				...state,
				search
			};
		});
	},
	registerActions: (actions) => {
		const actionsByKey = actions.reduce((acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		}, {});
		kbarWritable.update((state) => {
			return {
				...state,
				actions: {
					...actionsByKey,
					...state.actions
				}
			};
		});
		return function unregister() {
			kbarWritable.update((state) => {
				const actions2 = state.actions;
				const removeActionIds = Object.keys(actionsByKey);
				removeActionIds.forEach((actionId) => delete actions2[actionId]);
				return {
					...state,
					actions: {
						...state.actions,
						...actions2
					}
				};
			});
		};
	},
	reset: () => {
		kbarWritable.set({ ...kbarInitialState });
	}
};
var css$3 = {
	code: '.result-wrapper.svelte-1dddn8x{display:flex;align-items:center;background-color:white;padding:12px 16px}.active.svelte-1dddn8x{border-left:2px solid #000000;background-color:rgba(0 0 0 / 0.05)}.result-wrapper__name.svelte-1dddn8x{font-size:16px}.result-wrapper__titles.svelte-1dddn8x{width:100%}.result-wrapper__icon.svelte-1dddn8x{width:18px;height:18px;margin-right:8px}.result-wrapper__shortcut.svelte-1dddn8x{padding:4px 6px;background:rgba(0 0 0 / 0.1);border-radius:4px}',
	map: '{"version":3,"file":"DefaultResultWrapper.svelte","sources":["DefaultResultWrapper.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let result;\\nexport let active;\\n</script>\\n\\n<div class=\\"result-wrapper\\" class:active>\\n\\t{#if result.icon}\\n\\t\\t<div class=\\"result-wrapper__icon\\">\\n\\t\\t\\t<svelte:component this={result.icon} />\\n\\t\\t</div>\\n\\t{/if}\\n\\t<div class=\\"result-wrapper__titles\\">\\n\\t\\t<span class=\\"result-wrapper__name\\">{result.name}</span>\\n\\t\\t{#if result.subtitle}\\n\\t\\t\\t<div>{result.subtitle}</div>\\n\\t\\t{/if}\\n\\t</div>\\n\\t{#if result.shortcut}\\n\\t\\t<kbd class=\\"result-wrapper__shortcut\\">{result.shortcut}</kbd>\\n\\t{/if}\\n</div>\\n\\n<style>\\n\\t.result-wrapper {\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tbackground-color: white;\\n\\t\\tpadding: 12px 16px;\\n\\t}\\n\\n\\t.active {\\n\\t\\tborder-left: 2px solid #000000;\\n\\t\\tbackground-color: rgba(0 0 0 / 0.05);\\n\\t}\\n\\n\\t.result-wrapper__name {\\n\\t\\tfont-size: 16px;\\n\\t}\\n\\n\\t.result-wrapper__titles {\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\t.result-wrapper__icon {\\n\\t\\twidth: 18px;\\n\\t\\theight: 18px;\\n\\t\\tmargin-right: 8px;\\n\\t}\\n\\n\\t.result-wrapper__shortcut {\\n\\t\\tpadding: 4px 6px;\\n\\t\\tbackground: rgba(0 0 0 / 0.1);\\n\\t\\tborder-radius: 4px;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAsBC,eAAe,eAAC,CAAC,AAChB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,gBAAgB,CAAE,KAAK,CACvB,OAAO,CAAE,IAAI,CAAC,IAAI,AACnB,CAAC,AAED,OAAO,eAAC,CAAC,AACR,WAAW,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CAC9B,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,AACrC,CAAC,AAED,qBAAqB,eAAC,CAAC,AACtB,SAAS,CAAE,IAAI,AAChB,CAAC,AAED,uBAAuB,eAAC,CAAC,AACxB,KAAK,CAAE,IAAI,AACZ,CAAC,AAED,qBAAqB,eAAC,CAAC,AACtB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,YAAY,CAAE,GAAG,AAClB,CAAC,AAED,yBAAyB,eAAC,CAAC,AAC1B,OAAO,CAAE,GAAG,CAAC,GAAG,CAChB,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC7B,aAAa,CAAE,GAAG,AACnB,CAAC"}'
};
var DefaultResultWrapper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let { result } = $$props;
	let { active } = $$props;
	if ($$props.result === void 0 && $$bindings.result && result !== void 0)
		$$bindings.result(result);
	if ($$props.active === void 0 && $$bindings.active && active !== void 0)
		$$bindings.active(active);
	$$result.css.add(css$3);
	return `<div class="${['result-wrapper svelte-1dddn8x', active ? 'active' : '']
		.join(' ')
		.trim()}">${
		result.icon
			? `<div class="${'result-wrapper__icon svelte-1dddn8x'}">${validate_component(
					result.icon || missing_component,
					'svelte:component'
			  ).$$render($$result, {}, {}, {})}</div>`
			: ``
	}
	<div class="${'result-wrapper__titles svelte-1dddn8x'}"><span class="${'result-wrapper__name svelte-1dddn8x'}">${escape(
		result.name
	)}</span>
		${result.subtitle ? `<div>${escape(result.subtitle)}</div>` : ``}</div>
	${
		result.shortcut
			? `<kbd class="${'result-wrapper__shortcut svelte-1dddn8x'}">${escape(result.shortcut)}</kbd>`
			: ``
	}
</div>`;
});
var css$2 = {
	code: 'ul.svelte-1ph4m4y{list-style-type:none;padding:0;margin:0}button.svelte-1ph4m4y{display:block;background-color:white;width:100%;border:none;padding:0;margin:0;text-decoration:none;text-align:left;cursor:pointer;-webkit-appearance:none;-moz-appearance:none}',
	map: `{"version":3,"file":"KBarResults.svelte","sources":["KBarResults.svelte"],"sourcesContent":["<script lang=\\"ts\\">var _a;\\nimport { matchSorter } from 'match-sorter';\\nimport { createEventDispatcher } from 'svelte';\\nimport DefaultResultWrapper from './DefaultResultWrapper.svelte';\\nimport { kbarStore } from './kbar-store';\\nconst dispatch = createEventDispatcher();\\n// Props\\nexport let searchComponent;\\nexport let customListClass = null;\\nexport let customButtonClass = null;\\nexport let wrapper = null;\\n// Store bindings\\n$: ({ search, currentRootActionId, actions } = $kbarStore);\\n// Internal state\\nlet activeIndex = 0;\\nlet listBinding;\\nlet resultBindings = [];\\nlet hasFocus = false;\\nlet justEntered = false;\\nlet matches = [];\\n/**\\n * Focus the first visible action in the list\\n */\\nexport function focus() {\\n    if (matches.length && resultBindings.length) {\\n        justEntered = true;\\n        hasFocus = true;\\n        activeIndex = 0;\\n    }\\n}\\n/**\\n * Focus the last visible action in the list\\n */\\nexport function focusEnd() {\\n    if (matches.length && resultBindings.length) {\\n        justEntered = true;\\n        hasFocus = true;\\n        activeIndex = matches.length - 1;\\n    }\\n}\\n/**\\n * Select/perform the first visible action in the list\\n */\\nexport function selectFirst() {\\n    activeIndex = 0;\\n    select();\\n}\\nfunction resetActiveIndex() {\\n    activeIndex = 0;\\n}\\nfunction handleButtonClick(event, index) {\\n    event.stopPropagation();\\n    activeIndex = index;\\n    select();\\n}\\nfunction select() {\\n    if (activeIndex < 0) {\\n        return;\\n    }\\n    const action = matches[activeIndex];\\n    if (!action) {\\n        return;\\n    }\\n    if (action.perform) {\\n        action.perform();\\n        dispatch('hide');\\n    }\\n    else {\\n        kbarStore.setCurrentRootAction(action.id);\\n        kbarStore.setSearch('');\\n    }\\n}\\nfunction incrementActiveIndex() {\\n    if (activeIndex >= matches.length - 1) {\\n        activeIndex = 0;\\n    }\\n    else {\\n        activeIndex = activeIndex + 1;\\n    }\\n}\\nfunction decrementActiveIndex() {\\n    if (activeIndex === 0) {\\n        activeIndex = matches.length - 1;\\n    }\\n    else {\\n        activeIndex = activeIndex - 1;\\n    }\\n}\\nfunction handleWindowKeyDown(event) {\\n    if (!hasFocus) {\\n        return;\\n    }\\n    if (justEntered) {\\n        justEntered = false;\\n        return;\\n    }\\n    event.preventDefault();\\n    event.stopPropagation();\\n    if (event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'n')) {\\n        incrementActiveIndex();\\n    }\\n    if (event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'p')) {\\n        decrementActiveIndex();\\n    }\\n    if (event.key === 'Enter') {\\n        searchComponent.focus();\\n        select();\\n    }\\n    if (event.key === 'Home') {\\n        activeIndex = 0;\\n    }\\n    if (event.key === 'End') {\\n        activeIndex = matches.length - 1;\\n    }\\n    if (event.key === 'Tab' && !event.shiftKey) {\\n        incrementActiveIndex();\\n    }\\n    if (event.key === 'Tab' && event.shiftKey) {\\n        activeIndex = 0;\\n        searchComponent.focus();\\n    }\\n}\\nfunction checkIfBlurred() {\\n    if (!(listBinding === null || listBinding === void 0 ? void 0 : listBinding.contains(document.activeElement))) {\\n        hasFocus = false;\\n    }\\n}\\n$: {\\n    if (hasFocus && resultBindings.length && resultBindings.length > activeIndex) {\\n        (_a = resultBindings[activeIndex]) === null || _a === void 0 ? void 0 : _a.focus();\\n    }\\n}\\n$: actionsList = Object.keys(actions).map((key) => {\\n    return actions[key];\\n});\\n$: currActions = (function () {\\n    if (!currentRootActionId) {\\n        return actionsList.reduce((acc, curr) => {\\n            if (!curr.parent) {\\n                acc[curr.id] = curr;\\n            }\\n            return acc;\\n        }, {});\\n    }\\n    const root = actions[currentRootActionId];\\n    const children = root.children;\\n    if (!children) {\\n        return {\\n            [root.id]: root\\n        };\\n    }\\n    return {\\n        ...children.reduce((acc, actionId) => {\\n            acc[actionId] = actions[actionId];\\n            return acc;\\n        }, {})\\n    };\\n})();\\n$: filteredList = Object.keys(currActions).map((key) => {\\n    const action = currActions[key];\\n    return action;\\n});\\n$: {\\n    const trimmedSearch = search.trim();\\n    if (trimmedSearch === '') {\\n        matches = filteredList;\\n    }\\n    else {\\n        // Get a list of matches sorted by search relevance\\n        let sortedMatches = matchSorter(filteredList, search, { keys: ['keywords', 'name'] });\\n        if (trimmedSearch.length === 1) {\\n            // Find any matches with the given shortcut\\n            const shortcutActions = filteredList.filter((action) => action.shortcut.includes(trimmedSearch));\\n            const shortcutIds = shortcutActions.map((action) => action.id);\\n            if (shortcutActions.length) {\\n                sortedMatches = sortedMatches.filter((match) => {\\n                    return !shortcutIds.includes(match.id);\\n                });\\n                sortedMatches = [...shortcutActions, ...sortedMatches];\\n            }\\n        }\\n        matches = sortedMatches;\\n    }\\n}\\n// Reset active index on root action change\\n//@ts-ignore\\n$: currentRootActionId, filteredList.length, search, resetActiveIndex();\\n<\/script>\\n\\n<svelte:window on:keydown={handleWindowKeyDown} />\\n\\n{#if matches.length}\\n\\t<ul class={customListClass || ''} bind:this={listBinding} role=\\"menu\\">\\n\\t\\t{#each matches as match, index}\\n\\t\\t\\t<li role=\\"none\\">\\n\\t\\t\\t\\t<button\\n\\t\\t\\t\\t\\tclass={customButtonClass || ''}\\n\\t\\t\\t\\t\\trole=\\"menuitem\\"\\n\\t\\t\\t\\t\\tbind:this={resultBindings[index]}\\n\\t\\t\\t\\t\\ton:click={(e) => {\\n\\t\\t\\t\\t\\t\\thandleButtonClick(e, index);\\n\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\ton:focus={() => {\\n\\t\\t\\t\\t\\t\\thasFocus = true;\\n\\t\\t\\t\\t\\t\\tactiveIndex = index;\\n\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\ton:blur={checkIfBlurred}\\n\\t\\t\\t\\t\\ton:mouseenter={() => {\\n\\t\\t\\t\\t\\t\\tactiveIndex = index;\\n\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\ton:pointerdown={() => {\\n\\t\\t\\t\\t\\t\\tactiveIndex = index;\\n\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{#if !!wrapper}\\n\\t\\t\\t\\t\\t\\t<svelte:component this={wrapper} result={match} active={activeIndex === index} />\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t<DefaultResultWrapper result={match} active={activeIndex === index} />\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</button>\\n\\t\\t\\t</li>\\n\\t\\t{/each}\\n\\t</ul>\\n{/if}\\n\\n<style>\\n\\tul {\\n\\t\\tlist-style-type: none;\\n\\t\\tpadding: 0;\\n\\t\\tmargin: 0;\\n\\t}\\n\\n\\tbutton {\\n\\t\\tdisplay: block;\\n\\t\\tbackground-color: white;\\n\\t\\twidth: 100%;\\n\\t\\tborder: none;\\n\\t\\tpadding: 0;\\n\\t\\tmargin: 0;\\n\\t\\ttext-decoration: none;\\n\\t\\ttext-align: left;\\n\\t\\tcursor: pointer;\\n\\t\\t-webkit-appearance: none;\\n\\t\\t-moz-appearance: none;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAkOC,EAAE,eAAC,CAAC,AACH,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,AACV,CAAC,AAED,MAAM,eAAC,CAAC,AACP,OAAO,CAAE,KAAK,CACd,gBAAgB,CAAE,KAAK,CACvB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,CACT,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,OAAO,CACf,kBAAkB,CAAE,IAAI,CACxB,eAAe,CAAE,IAAI,AACtB,CAAC"}`
};
var KBarResults = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let search;
	let currentRootActionId;
	let actions;
	let actionsList;
	let currActions;
	let filteredList;
	let $kbarStore, $$unsubscribe_kbarStore;
	$$unsubscribe_kbarStore = subscribe(kbarStore, (value) => ($kbarStore = value));
	var _a;
	const dispatch = createEventDispatcher();
	let { searchComponent } = $$props;
	let { customListClass = null } = $$props;
	let { customButtonClass = null } = $$props;
	let { wrapper = null } = $$props;
	let activeIndex = 0;
	let listBinding;
	let resultBindings = [];
	let hasFocus = false;
	let matches = [];
	function focus() {
		if (matches.length && resultBindings.length) {
			hasFocus = true;
			activeIndex = 0;
		}
	}
	function focusEnd() {
		if (matches.length && resultBindings.length) {
			hasFocus = true;
			activeIndex = matches.length - 1;
		}
	}
	function selectFirst() {
		activeIndex = 0;
		select();
	}
	function resetActiveIndex() {
		activeIndex = 0;
	}
	function select() {
		if (activeIndex < 0) {
			return;
		}
		const action = matches[activeIndex];
		if (!action) {
			return;
		}
		if (action.perform) {
			action.perform();
			dispatch('hide');
		} else {
			kbarStore.setCurrentRootAction(action.id);
			kbarStore.setSearch('');
		}
	}
	if (
		$$props.searchComponent === void 0 &&
		$$bindings.searchComponent &&
		searchComponent !== void 0
	)
		$$bindings.searchComponent(searchComponent);
	if (
		$$props.customListClass === void 0 &&
		$$bindings.customListClass &&
		customListClass !== void 0
	)
		$$bindings.customListClass(customListClass);
	if (
		$$props.customButtonClass === void 0 &&
		$$bindings.customButtonClass &&
		customButtonClass !== void 0
	)
		$$bindings.customButtonClass(customButtonClass);
	if ($$props.wrapper === void 0 && $$bindings.wrapper && wrapper !== void 0)
		$$bindings.wrapper(wrapper);
	if ($$props.focus === void 0 && $$bindings.focus && focus !== void 0) $$bindings.focus(focus);
	if ($$props.focusEnd === void 0 && $$bindings.focusEnd && focusEnd !== void 0)
		$$bindings.focusEnd(focusEnd);
	if ($$props.selectFirst === void 0 && $$bindings.selectFirst && selectFirst !== void 0)
		$$bindings.selectFirst(selectFirst);
	$$result.css.add(css$2);
	({ search, currentRootActionId, actions } = $kbarStore);
	{
		{
			if (hasFocus && resultBindings.length && resultBindings.length > activeIndex) {
				(_a = resultBindings[activeIndex]) === null || _a === void 0 ? void 0 : _a.focus();
			}
		}
	}
	actionsList = Object.keys(actions).map((key) => {
		return actions[key];
	});
	currActions = (function () {
		if (!currentRootActionId) {
			return actionsList.reduce((acc, curr) => {
				if (!curr.parent) {
					acc[curr.id] = curr;
				}
				return acc;
			}, {});
		}
		const root = actions[currentRootActionId];
		const children = root.children;
		if (!children) {
			return { [root.id]: root };
		}
		return {
			...children.reduce((acc, actionId) => {
				acc[actionId] = actions[actionId];
				return acc;
			}, {})
		};
	})();
	filteredList = Object.keys(currActions).map((key) => {
		const action = currActions[key];
		return action;
	});
	{
		{
			const trimmedSearch = search.trim();
			if (trimmedSearch === '') {
				matches = filteredList;
			} else {
				let sortedMatches = (0, import_match_sorter.matchSorter)(filteredList, search, {
					keys: ['keywords', 'name']
				});
				if (trimmedSearch.length === 1) {
					const shortcutActions = filteredList.filter((action) =>
						action.shortcut.includes(trimmedSearch)
					);
					const shortcutIds = shortcutActions.map((action) => action.id);
					if (shortcutActions.length) {
						sortedMatches = sortedMatches.filter((match) => {
							return !shortcutIds.includes(match.id);
						});
						sortedMatches = [...shortcutActions, ...sortedMatches];
					}
				}
				matches = sortedMatches;
			}
		}
	}
	{
		filteredList.length, resetActiveIndex();
	}
	$$unsubscribe_kbarStore();
	return `

${
	matches.length
		? `<ul class="${
				escape(null_to_empty(customListClass || '')) + ' svelte-1ph4m4y'
		  }" role="${'menu'}"${add_attribute('this', listBinding, 0)}>${each(
				matches,
				(match, index2) => `<li role="${'none'}"><button class="${
					escape(null_to_empty(customButtonClass || '')) + ' svelte-1ph4m4y'
				}" role="${'menuitem'}"${add_attribute('this', resultBindings[index2], 0)}>${
					!!wrapper
						? `${validate_component(wrapper || missing_component, 'svelte:component').$$render(
								$$result,
								{
									result: match,
									active: activeIndex === index2
								},
								{},
								{}
						  )}`
						: `${validate_component(DefaultResultWrapper, 'DefaultResultWrapper').$$render(
								$$result,
								{
									result: match,
									active: activeIndex === index2
								},
								{},
								{}
						  )}`
				}</button>
			</li>`
		  )}</ul>`
		: ``
}`;
});
var KBarSearch = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let search;
	let currentRootActionId;
	let actions;
	let $kbarStore, $$unsubscribe_kbarStore;
	$$unsubscribe_kbarStore = subscribe(kbarStore, (value) => ($kbarStore = value));
	let { resultsComponent } = $$props;
	let { customClass = null } = $$props;
	let { placeholder = 'Type a command or search...' } = $$props;
	let searchInput;
	function focus() {
		searchInput.focus();
	}
	if (
		$$props.resultsComponent === void 0 &&
		$$bindings.resultsComponent &&
		resultsComponent !== void 0
	)
		$$bindings.resultsComponent(resultsComponent);
	if ($$props.customClass === void 0 && $$bindings.customClass && customClass !== void 0)
		$$bindings.customClass(customClass);
	if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0)
		$$bindings.placeholder(placeholder);
	if ($$props.focus === void 0 && $$bindings.focus && focus !== void 0) $$bindings.focus(focus);
	({ search, currentRootActionId, actions } = $kbarStore);
	$$unsubscribe_kbarStore();
	return `<input${add_attribute('class', customClass || '', 0)}${add_attribute(
		'value',
		search,
		0
	)}${add_attribute('placeholder', placeholder, 0)}${add_attribute('this', searchInput, 0)}>`;
});
var css$1 = {
	code: '.kbar__position-container.svelte-a16tqz{position:fixed;display:flex;align-items:flex-start;justify-content:center;width:100%;inset:0px;padding:14vh 16px 16px}',
	map: '{"version":3,"file":"KBar.svelte","sources":["KBar.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, onDestroy } from \'svelte\';\\nimport { fade } from \'svelte/transition\';\\nimport Portal from \'svelte-portal/src/Portal.svelte\';\\nimport { kbarStore } from \'./kbar-store\';\\nimport KBarResults from \'./KBarResults.svelte\';\\nimport KBarSearch from \'./KBarSearch.svelte\';\\n/**\\n * Custom styles for the positioning container\\n */\\nexport let positionContainerStyles = \'\';\\n/**\\n * List of actions to include in the KBar selection\\n */\\nexport let actions = [];\\n/**\\n * Custom CSS class for the containing KBar dialog\\n *\\n * Be sure to wrap your class selector with `:global()`, for example\\n *\\n * ```css\\n * :global(.myKbarDialog) {\\n *   color: red;\\n * }\\n * ```\\n */\\nexport let dialogClass = null;\\n/**\\n * Custom CSS class for the search input\\n *\\n * Be sure to wrap your class selector with `:global()`, for example\\n *\\n * ```css\\n * :global(.myKbarSearchInput) {\\n *   color: red;\\n * }\\n * ```\\n */\\nexport let searchClass = null;\\n/**\\n * Placeholder text to display in the search input\\n */\\nexport let searchPlaceholder = \'Type a command or search...\';\\n/**\\n * Custom CSS class for the list of actions\\n *\\n * Be sure to wrap your class selector with `:global()`, for example\\n *\\n * ```css\\n * :global(.myKbarAction) {\\n *   color: red;\\n * }\\n * ```\\n */\\nexport let resultListClass = null;\\n/**\\n * Custom CSS class for a single result item\\n *\\n * Be sure to wrap your class selector with `:global()`, for example\\n *\\n * ```css\\n * :global(.myKbarResult) {\\n *   color: red;\\n * }\\n * ```\\n */\\nexport let resultItemClass = null;\\n/**\\n * The component to display the details of a single Action.\\n *\\n * Should accept the props\\n * - `result`: Action\\n * - `active`: boolean\\n *\\n * DefaultResultWrapper is the default wrapper used.\\n */\\nexport let resultWrapper = null;\\n/**\\n * Transition for the KBar to fade in. This can be any transition you want.\\n */\\nexport let transitionIn = fade;\\n/**\\n * Parameters to pass the fade-in transition\\n */\\nexport let transitionInParams = { duration: 200 };\\n/**\\n * Transition for the KBar to fade out. This can be any transition you want.\\n */\\nexport let transitionOut = fade;\\n/**\\n * Parameters to pass the fade-out transition\\n */\\nexport let transitionOutParams = { duration: 200 };\\nlet resultsBinding;\\nlet searchBinding;\\nlet kbarBinding;\\nlet previousActiveElement;\\n$: ({ visible } = $kbarStore);\\nexport function hide(restoreFocus = false) {\\n    kbarStore.hide();\\n    if (restoreFocus) {\\n        previousActiveElement.focus();\\n    }\\n}\\nexport function show() {\\n    kbarStore.setSearch(\'\');\\n    kbarStore.setCurrentRootAction(null);\\n    kbarStore.show();\\n    previousActiveElement = document.activeElement;\\n}\\nfunction handleWindowKeydown(event) {\\n    if (event.ctrlKey && event.key === \'k\') {\\n        event.preventDefault();\\n        if (visible) {\\n            hide(true);\\n        }\\n        else {\\n            show();\\n        }\\n    }\\n    if (event.key === \'Escape\') {\\n        if (visible) {\\n            event.preventDefault();\\n            hide(true);\\n        }\\n    }\\n}\\nfunction handleWindowClick(event) {\\n    if (visible &&\\n        kbarBinding &&\\n        !kbarBinding.contains(event.target) &&\\n        kbarBinding !== event.target) {\\n        hide();\\n    }\\n    else {\\n        event.stopPropagation();\\n    }\\n}\\nlet unregisterActions;\\nonMount(() => {\\n    unregisterActions = kbarStore.registerActions(actions);\\n});\\nonDestroy(() => {\\n    if (unregisterActions) {\\n        unregisterActions();\\n    }\\n});\\n</script>\\n\\n<svelte:window on:keydown={handleWindowKeydown} on:click={handleWindowClick} />\\n\\n<Portal target=\\"body\\">\\n\\t{#if visible}\\n\\t\\t<div class=\\"kbar__position-container\\" style={positionContainerStyles}>\\n\\t\\t\\t<div\\n\\t\\t\\t\\trole=\\"dialog\\"\\n\\t\\t\\t\\tclass={dialogClass || \'\'}\\n\\t\\t\\t\\tbind:this={kbarBinding}\\n\\t\\t\\t\\tin:transitionIn={transitionInParams}\\n\\t\\t\\t\\tout:transitionOut={transitionOutParams}\\n\\t\\t\\t>\\n\\t\\t\\t\\t<KBarSearch\\n\\t\\t\\t\\t\\tcustomClass={searchClass}\\n\\t\\t\\t\\t\\tresultsComponent={resultsBinding}\\n\\t\\t\\t\\t\\tplaceholder={searchPlaceholder}\\n\\t\\t\\t\\t\\tbind:this={searchBinding}\\n\\t\\t\\t\\t/>\\n\\t\\t\\t\\t<KBarResults\\n\\t\\t\\t\\t\\twrapper={resultWrapper}\\n\\t\\t\\t\\t\\tcustomListClass={resultListClass}\\n\\t\\t\\t\\t\\tcustomButtonClass={resultItemClass}\\n\\t\\t\\t\\t\\ton:hide={() => {\\n\\t\\t\\t\\t\\t\\thide(true);\\n\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\tsearchComponent={searchBinding}\\n\\t\\t\\t\\t\\tbind:this={resultsBinding}\\n\\t\\t\\t\\t/>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t{/if}\\n</Portal>\\n\\n<style>\\n\\t.kbar__position-container {\\n\\t\\tposition: fixed;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: flex-start;\\n\\t\\tjustify-content: center;\\n\\t\\twidth: 100%;\\n\\t\\tinset: 0px;\\n\\t\\tpadding: 14vh 16px 16px;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAsLC,yBAAyB,cAAC,CAAC,AAC1B,QAAQ,CAAE,KAAK,CACf,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,UAAU,CACvB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,IAAI,CACX,KAAK,CAAE,GAAG,CACV,OAAO,CAAE,IAAI,CAAC,IAAI,CAAC,IAAI,AACxB,CAAC"}'
};
var KBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let visible;
	let $kbarStore, $$unsubscribe_kbarStore;
	$$unsubscribe_kbarStore = subscribe(kbarStore, (value) => ($kbarStore = value));
	let { positionContainerStyles = '' } = $$props;
	let { actions = [] } = $$props;
	let { dialogClass = null } = $$props;
	let { searchClass = null } = $$props;
	let { searchPlaceholder = 'Type a command or search...' } = $$props;
	let { resultListClass = null } = $$props;
	let { resultItemClass = null } = $$props;
	let { resultWrapper = null } = $$props;
	let { transitionIn = fade } = $$props;
	let { transitionInParams = { duration: 200 } } = $$props;
	let { transitionOut = fade } = $$props;
	let { transitionOutParams = { duration: 200 } } = $$props;
	let resultsBinding;
	let searchBinding;
	let kbarBinding;
	let previousActiveElement;
	function hide(restoreFocus = false) {
		kbarStore.hide();
		if (restoreFocus) {
			previousActiveElement.focus();
		}
	}
	function show() {
		kbarStore.setSearch('');
		kbarStore.setCurrentRootAction(null);
		kbarStore.show();
		previousActiveElement = document.activeElement;
	}
	onDestroy(() => {});
	if (
		$$props.positionContainerStyles === void 0 &&
		$$bindings.positionContainerStyles &&
		positionContainerStyles !== void 0
	)
		$$bindings.positionContainerStyles(positionContainerStyles);
	if ($$props.actions === void 0 && $$bindings.actions && actions !== void 0)
		$$bindings.actions(actions);
	if ($$props.dialogClass === void 0 && $$bindings.dialogClass && dialogClass !== void 0)
		$$bindings.dialogClass(dialogClass);
	if ($$props.searchClass === void 0 && $$bindings.searchClass && searchClass !== void 0)
		$$bindings.searchClass(searchClass);
	if (
		$$props.searchPlaceholder === void 0 &&
		$$bindings.searchPlaceholder &&
		searchPlaceholder !== void 0
	)
		$$bindings.searchPlaceholder(searchPlaceholder);
	if (
		$$props.resultListClass === void 0 &&
		$$bindings.resultListClass &&
		resultListClass !== void 0
	)
		$$bindings.resultListClass(resultListClass);
	if (
		$$props.resultItemClass === void 0 &&
		$$bindings.resultItemClass &&
		resultItemClass !== void 0
	)
		$$bindings.resultItemClass(resultItemClass);
	if ($$props.resultWrapper === void 0 && $$bindings.resultWrapper && resultWrapper !== void 0)
		$$bindings.resultWrapper(resultWrapper);
	if ($$props.transitionIn === void 0 && $$bindings.transitionIn && transitionIn !== void 0)
		$$bindings.transitionIn(transitionIn);
	if (
		$$props.transitionInParams === void 0 &&
		$$bindings.transitionInParams &&
		transitionInParams !== void 0
	)
		$$bindings.transitionInParams(transitionInParams);
	if ($$props.transitionOut === void 0 && $$bindings.transitionOut && transitionOut !== void 0)
		$$bindings.transitionOut(transitionOut);
	if (
		$$props.transitionOutParams === void 0 &&
		$$bindings.transitionOutParams &&
		transitionOutParams !== void 0
	)
		$$bindings.transitionOutParams(transitionOutParams);
	if ($$props.hide === void 0 && $$bindings.hide && hide !== void 0) $$bindings.hide(hide);
	if ($$props.show === void 0 && $$bindings.show && show !== void 0) $$bindings.show(show);
	$$result.css.add(css$1);
	let $$settled;
	let $$rendered;
	do {
		$$settled = true;
		({ visible } = $kbarStore);
		$$rendered = `

${validate_component(Portal, 'Portal').$$render(
	$$result,
	{ target: 'body' },
	{},
	{
		default: () =>
			`${
				visible
					? `<div class="${'kbar__position-container svelte-a16tqz'}"${add_attribute(
							'style',
							positionContainerStyles,
							0
					  )}><div role="${'dialog'}" class="${
							escape(null_to_empty(dialogClass || '')) + ' svelte-a16tqz'
					  }"${add_attribute('this', kbarBinding, 0)}>${validate_component(
							KBarSearch,
							'KBarSearch'
					  ).$$render(
							$$result,
							{
								customClass: searchClass,
								resultsComponent: resultsBinding,
								placeholder: searchPlaceholder,
								this: searchBinding
							},
							{
								this: ($$value) => {
									searchBinding = $$value;
									$$settled = false;
								}
							},
							{}
					  )}
				${validate_component(KBarResults, 'KBarResults').$$render(
					$$result,
					{
						wrapper: resultWrapper,
						customListClass: resultListClass,
						customButtonClass: resultItemClass,
						searchComponent: searchBinding,
						this: resultsBinding
					},
					{
						this: ($$value) => {
							resultsBinding = $$value;
							$$settled = false;
						}
					},
					{}
				)}</div></div>`
					: ``
			}`
	}
)}`;
	} while (!$$settled);
	$$unsubscribe_kbarStore();
	return $$rendered;
});
var MailIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	return `<div><svg xmlns="${'http://www.w3.org/2000/svg'}" class="${'h-6 w-6'}" fill="${'none'}" viewBox="${'0 0 24 24'}" stroke="${'currentColor'}"><path stroke-linecap="${'round'}" stroke-linejoin="${'round'}" stroke-width="${'2'}" d="${'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'}"></path></svg></div>`;
});
var css = {
	code: '.mySearch{border:none;padding-left:16px;height:56px;width:512px;font-size:16px}.myDialog{box-shadow:1px 2px 2px hsl(0deg 0% 50% / 0.2), 2px 4px 4px hsl(0deg 0% 50% / 0.2),\n			4px 8px 8px hsl(0deg 0% 50% / 0.2), 8px 16px 16px hsl(0deg 0% 50% / 0.2),\n			16px 32px 32px hsl(0deg 0% 50% / 0.2)}',
	map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script lang=\\"ts\\">import KBar from '$lib/KBar.svelte';\\nimport MailIcon from '../example/MailIcon.svelte';\\nconst actions = [\\n    {\\n        id: 'blog',\\n        name: 'Blog',\\n        shortcut: ['b'],\\n        keywords: 'writing words',\\n        icon: MailIcon,\\n        subtitle: 'Go to the blog!',\\n        perform: () => (window.location.pathname = 'blog')\\n    },\\n    {\\n        id: 'contact',\\n        name: 'Contact',\\n        shortcut: ['c'],\\n        keywords: 'email',\\n        perform: () => (window.location.pathname = 'contact')\\n    },\\n    {\\n        id: 'theme',\\n        name: 'Set Theme',\\n        shortcut: ['t'],\\n        keywords: 'dark light mode',\\n        children: ['dark', 'light']\\n    },\\n    {\\n        id: 'dark',\\n        name: 'Dark Mode',\\n        parent: 'theme',\\n        shortcut: ['d'],\\n        keywords: '',\\n        perform: () => {\\n            console.log('Dark mode');\\n        }\\n    },\\n    {\\n        id: 'light',\\n        name: 'Light Mode',\\n        parent: 'theme',\\n        shortcut: ['l'],\\n        keywords: '',\\n        perform: () => {\\n            console.log('Light mode');\\n        }\\n    }\\n];\\n<\/script>\\n\\n<div>\\n\\t<a href=\\"#test\\">Link to test focus</a>\\n\\t<KBar searchClass=\\"mySearch\\" dialogClass=\\"myDialog\\" {actions} />\\n</div>\\n\\n<style>\\n\\t:global(.mySearch) {\\n\\t\\tborder: none;\\n\\t\\tpadding-left: 16px;\\n\\t\\theight: 56px;\\n\\t\\twidth: 512px;\\n\\t\\tfont-size: 16px;\\n\\t}\\n\\n\\t:global(.myDialog) {\\n\\t\\tbox-shadow: 1px 2px 2px hsl(0deg 0% 50% / 0.2), 2px 4px 4px hsl(0deg 0% 50% / 0.2),\\n\\t\\t\\t4px 8px 8px hsl(0deg 0% 50% / 0.2), 8px 16px 16px hsl(0deg 0% 50% / 0.2),\\n\\t\\t\\t16px 32px 32px hsl(0deg 0% 50% / 0.2);\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAuDS,SAAS,AAAE,CAAC,AACnB,MAAM,CAAE,IAAI,CACZ,YAAY,CAAE,IAAI,CAClB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,KAAK,CACZ,SAAS,CAAE,IAAI,AAChB,CAAC,AAEO,SAAS,AAAE,CAAC,AACnB,UAAU,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,IAAI,CAAC,EAAE,CAAC,GAAG,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,IAAI,CAAC,EAAE,CAAC,GAAG,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC;GAClF,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,IAAI,CAAC,EAAE,CAAC,GAAG,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,GAAG,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,IAAI,CAAC,EAAE,CAAC,GAAG,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC;GACzE,IAAI,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,IAAI,CAAC,EAAE,CAAC,GAAG,CAAC,CAAC,CAAC,GAAG,CAAC,AACvC,CAAC"}`
};
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	const actions = [
		{
			id: 'blog',
			name: 'Blog',
			shortcut: ['b'],
			keywords: 'writing words',
			icon: MailIcon,
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
	];
	$$result.css.add(css);
	return `<div><a href="${'#test'}">Link to test focus</a>
	${validate_component(KBar, 'KBar').$$render(
		$$result,
		{
			searchClass: 'mySearch',
			dialogClass: 'myDialog',
			actions
		},
		{},
		{}
	)}
</div>`;
});
var index = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	[Symbol.toStringTag]: 'Module',
	default: Routes
});

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
	const { pathname, searchParams } = new URL(req.url || '', 'http://localhost');
	let body;
	try {
		body = await getRawBody(req);
	} catch (err) {
		res.statusCode = err.status || 400;
		return res.end(err.reason || 'Invalid request body');
	}
	const rendered = await render({
		method: req.method,
		headers: req.headers,
		path: pathname,
		query: searchParams,
		rawBody: body
	});
	if (rendered) {
		const { status, headers, body: body2 } = rendered;
		return res.writeHead(status, headers).end(body2);
	}
	return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
