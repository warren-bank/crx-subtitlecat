// ==UserScript==
// @name         subtitlecat
// @description  Determine the best matching subtitle on "subtitlecat.com".
// @version      1.0.0
// @match        *://*.subtitlecat.com/index.php?search=*
// @match        *://*.subtitlecat.com/subs/*
// @icon         https://www.subtitlecat.com/favicon_large.jpg
// @require      https://cdn.jsdelivr.net/npm/sha-1@1.0.0/dist/sha1.umd.js
// @run-at       document-end
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-subtitlecat/tree/userscript/es6
// @supportURL   https://github.com/warren-bank/crx-subtitlecat/issues
// @downloadURL  https://github.com/warren-bank/crx-subtitlecat/raw/userscript/es6/userscript/subtitlecat.user.js
// @updateURL    https://github.com/warren-bank/crx-subtitlecat/raw/userscript/es6/userscript/subtitlecat.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- user options

const user_options = {
  "translated_from": "english",
  "search_results": {
    "filter": true,
    "redirect_to_best_match": true
  },
  "airplay_receiver": {
    "host": "",
    "port": "8192"
  },
  "debug": true
}

// ----------------------------------------------------------------------------- misc utils

if (user_options.translated_from)
  user_options.translated_from = user_options.translated_from.toLowerCase()

const empty_dom_node = node => {
  if (!node || !(node instanceof Node)) return

  while (node.childNodes.length)
    node.removeChild(node.childNodes[0])
}

const make_element = (elementName, html, text) => {
  const el = unsafeWindow.document.createElement(elementName)

  if (html)
    el.innerHTML = html

  if (text)
    el.textContent = text

  return el
}

// ----------------------------------------------------------------------------- cookie management

const get_cookie_value = (key) => {
  const pattern = new RegExp('(?:^|;)\\s*' + key + '\\s*=\\s*([^;]+)(?:;|$)')
  const cookies = unsafeWindow.document.cookie
  const matches = pattern.exec(cookies)
  return (matches && matches.length) ? matches[1] : ''
}

const set_cookie_value = (key, val) => {
  unsafeWindow.document.cookie = `${key}=${val};domain=${window.location.hostname};path=${window.location.pathname};max-age=${60*60*24*365}`
}

const persist_form_fields = (airplay_host, airplay_port, airplay_tls) => {
  set_cookie_value('airplay_host', airplay_host)
  set_cookie_value('airplay_port', airplay_port)
  set_cookie_value('airplay_tls',  (airplay_tls ? '1' : '0'))
}

// ----------------------------------------------------------------------------- search results

const process_search_results = () => {
  if (!user_options.search_results.filter && !user_options.search_results.redirect_to_best_match) return

  const search_results = normalize_search_results()
    .filter(obj => obj.language === user_options.translated_from)
    .sort((a,b) => b.downloads - a.downloads)
  if (!search_results.length) return

  if (user_options.debug)
    console.log(search_results)

  if (user_options.search_results.redirect_to_best_match)
    window.location = search_results[0].url
  else
    rewrite_dom_for_search_results(search_results)
}

// return [{name, url, language, size, downloads}]
const normalize_search_results = () => {
  const language_regex = /\(\s*translated from\s+([^\)]+)\s*\)/i

  return [...unsafeWindow.document.querySelectorAll('body > div.subtitles table.sub-table tr')]
    .map($tr => {
      const $td = [...$tr.children].filter(el => el.tagName === 'TD')
      if ($td.length !== 5) return null

      const $a = $td[0].querySelector('a[href]')
      if (!$a) return null

      const name = $a.textContent.trim()
      const url = $a.href
      const match = language_regex.exec($a.nextSibling.textContent)
      const language = match ? match[1].toLowerCase() : null
      const size = unsafeWindow.parseInt(
        $td[2].querySelector('span.sub-table__metric-value')?.textContent || '0',
        10
      )
      const downloads = unsafeWindow.parseInt(
        $td[3].textContent.trim() || '0',
        10
      )
      return {name, url, language, size, downloads}
    })
    .filter(obj => !!obj)
}

const rewrite_dom_for_search_results = search_results => {
  const $table = make_element('table')
  let $tr, $td

  $tr = make_element('tr')
  $table.appendChild($tr)
  const keys = Object.keys(search_results[0])
  for (const key of keys) {
    $td = make_element('th', null, key)
    $tr.appendChild($td)
  }

  for (const obj of search_results) {
    $tr = make_element('tr')
    $table.appendChild($tr)
    for (const key of keys) {
      $td = (key === 'url')
        ? make_element('td', `<a href="${obj[key]}">${obj[key]}</a>`, null)
        : make_element('td', null, obj[key])
      $tr.appendChild($td)
    }
  }

  $table.setAttribute('width', '100%')
  $table.setAttribute('border', '1')
  $table.setAttribute('cellpadding', '4')
  $table.style.backgroundColor = 'white'

  const $body = unsafeWindow.document.body
  empty_dom_node($body)
  $body.style.padding = '1em'
  $body.appendChild($table)
}

// ----------------------------------------------------------------------------- subtitle

const process_subtitle = () => {
  const subtitle = normalize_subtitles()
    .filter(obj => obj.language === user_options.translated_from)
  if (!subtitle.length) return

  if (user_options.debug)
    console.log(subtitle)

  rewrite_dom_for_subtitle(subtitle[0])
}

// return [{url, language}]
const normalize_subtitles = () => {
  return [...unsafeWindow.document.querySelectorAll('div.sub-single')]
    .map($div => {
      const $span = [...$div.children].filter(el => el.tagName === 'SPAN')
      if ($span.length !== 3) return null

      const language = $span[1].textContent.trim().toLowerCase()
      const url = $span[2].querySelector('a.green-link[href]')?.href

      return (url && language)
        ? {url, language}
        : null
    })
    .filter(obj => !!obj)
}

const rewrite_dom_for_subtitle = subtitle => {
  const $style = make_element('style', null, `
body > div .oneline {
  height: 2em;
  line-height: 2em;
  white-space: nowrap;
}
body > div .oneline > * {
  height: 100%;
  vertical-align: middle;
}
body > div .left {
  text-align: left;
}
body > div .right {
  text-align: right;
}
  `)

  const $table = make_element('table', `
    <tr>
      <td class="oneline right">
        <h3>Subtitle:</h3>
      </td>
      <td class="oneline left">
        <a href="${subtitle.url}">${subtitle.language}</a>
      </td>
    </tr>
    <tr>
      <td colspan="2" class="oneline" align="center">
        <h3>Network Address of AirPlay Receiver:</h3>
      </td>
    </tr>
    <tr>
      <td class="oneline right">
        <label for="airplay_host">Host:</label>
      </td>
      <td class="oneline left">
        <input id="airplay_host" type="text" size="15" placeholder="192.168.0.100" value="${get_cookie_value('airplay_host') || user_options.airplay_receiver.host || ''}">
      </td>
    </tr>
    <tr>
      <td class="oneline right">
        <label for="airplay_port">Port:</label>
      </td>
      <td class="oneline left">
        <input id="airplay_port" type="number" x-type="range" x-min="1" x-max="999999" x-step="1" min="1" max="999999" step="1" size="6" placeholder="8192" value="${get_cookie_value('airplay_port') || user_options.airplay_receiver.port || ''}">
      </td>
    </tr>
    <tr>
      <td class="oneline right">
        <label for="airplay_password">Password:</label>
      </td>
      <td class="oneline left">
        <input id="airplay_password" type="text" size="15">
      </td>
    </tr>
    <tr>
      <td class="oneline right">
        <label for="airplay_tls">HTTPS:</label>
      </td>
      <td class="oneline left">
        <input id="airplay_tls" type="checkbox" ${(get_cookie_value('airplay_tls') === '1') ? 'checked' : ''}>
      </td>
    </tr>
    <tr>
      <td colspan="2" class="oneline" align="center">
        <button id="load_captions">Load Captions</button>
      </td>
    </tr>
  `)

  $table.setAttribute('align', 'center')

  const $head = unsafeWindow.document.getElementsByTagName('head')[0]
  empty_dom_node($head)
  $head.appendChild($style)

  const $body = unsafeWindow.document.body
  empty_dom_node($body)
  $body.style.padding = '1em'
  $body.appendChild($table)

  add_dom_event_listeners_for_subtitle(subtitle)
}

const add_dom_event_listeners_for_subtitle = subtitle => {
  const $load_captions = unsafeWindow.document.querySelector('button#load_captions')

  $load_captions.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const path = '/load-captions'
    const data = `Caption-Location: ${subtitle.url}`

    send_message(path, data)
  }
}

let client_ip = null

const send_message = (path, data, callback, is_retry) => {
  const $airplay_host     = unsafeWindow.document.querySelector('input#airplay_host')
  const $airplay_port     = unsafeWindow.document.querySelector('input#airplay_port')
  const $airplay_password = unsafeWindow.document.querySelector('input#airplay_password')
  const $airplay_tls      = unsafeWindow.document.querySelector('input#airplay_tls')

  const host     = $airplay_host.value.trim()
  const port     = $airplay_port.value.trim() || '8192'
  const password = $airplay_password.value.trim()
  const hash     = (client_ip && password && (typeof window.sha1 === 'function'))
    ? window.sha1(`${client_ip}:${password}`)
    : null
  const tls      = $airplay_tls.checked
  const url      = `${ tls ? 'https' : 'http' }://${host}:${port}${path}`

  if (!host) {
    unsafeWindow.alert('AirPlay "host" is required')
    return
  }
  if (!path) {
    unsafeWindow.alert('AirPlay "path" is required')
    return
  }

  const xhr = new unsafeWindow.XMLHttpRequest()

  xhr.onload = () => {
    if (xhr.readyState === 4) {
      if ((xhr.status === 200) && (typeof callback === 'function')) {
        callback(xhr.responseText)
      }
      if (xhr.status === 401) {
        if (xhr.responseText && (client_ip !== xhr.responseText))
          client_ip = xhr.responseText

        if (!is_retry && client_ip && password && (typeof window.sha1 === 'function'))
          send_message(path, data, callback, true)
        else
          unsafeWindow.alert('AirPlay "password" is required')
      }
    }
  }

  if (data) {
    xhr.open("POST", url, true, null, null)
    xhr.setRequestHeader("Content-Type", "text/parameters")
    if (hash)
      xhr.setRequestHeader("X-ExoAirPlayer-Password", hash)
    xhr.send(data)
  }
  else {
    xhr.open("GET", url, true, null, null)
    if (hash)
      xhr.setRequestHeader("X-ExoAirPlayer-Password", hash)
    xhr.send()
  }

  // save network address of AirPlay receiver in cookie
  if (!is_retry)
    persist_form_fields(host, port, tls)
}

// ----------------------------------------------------------------------------- init

const init = () => {
  if (unsafeWindow.location.pathname.startsWith('/subs/'))
    process_subtitle()
  else
    process_search_results()
}

if (user_options.debug && (typeof unsafeWindow === 'undefined'))
  window.unsafeWindow = window

init()
