#!/usr/bin/env node
//
// Production start wrapper for the Next.js standalone server.
//
// The standalone server (node .next/standalone/server.js) binds to
// `process.env.HOSTNAME || '0.0.0.0'`. Container hosts such as Render
// export a HOSTNAME (the container id / host name), so the server either
// binds to a single interface — unreachable from Render's router, which
// returns 502 Bad Gateway — or crashes outright with
// `getaddrinfo ENOTFOUND` when the hostname does not resolve.
//
// Render requires web services to bind to 0.0.0.0, so pin it here before
// handing off to the standalone server. PORT is still honoured (Render
// sets it automatically; default 3000 locally).
//
'use strict'
process.env.HOSTNAME = '0.0.0.0'
require('./.next/standalone/server.js')
