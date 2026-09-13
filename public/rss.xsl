<?xml version="1.0" encoding="UTF-8"?>
<!--
  rss.xsl — browser-facing dress for the RSS feed. Feed READERS ignore this
  entirely (they parse the XML); browsers that support XSLT render the feed
  as a branded explainer page instead of a raw document tree. If a browser
  drops XSLT support (Chrome has deprecation plans), behavior degrades to
  the plain XML view — never worse than having no stylesheet at all.
  BRAND TOKENS ARE A SECOND COPY HERE, and that is the known weakness of this
  file rather than a design choice: it renders standalone, outside the site's
  CSS pipeline, so it cannot read a custom property. It therefore went stale
  exactly the way every other hand-kept copy on this site has — it was still
  painting the retired dark slate ground, its pale text and its bright cyan links
  on 2026-08-26, two days after the palette inverted, on a page served live at
  /rss.xsl to anyone who opens the feed in a browser. (The retired values are
  named in words rather than written out, because this file is copied into
  dist/ and a literal retired hex here would trip the very gate described
  below.)

  Nothing could have caught it: the gate held the retired-hex list and pointed
  it at exactly one file. `npm run gate` now scans every served text file for
  those hexes AND asserts this file carries the current ground token, so the
  second copy is checked rather than remembered. If you change a colour in
  src/styles/global.css, change it here too and the gate will tell you if you
  did not.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS feed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body { margin: 0; background: #faf7f2; color: #17150f;
                 font-family: Inter, ui-sans-serif, system-ui, sans-serif;
                 -webkit-font-smoothing: antialiased; }
          .wrap { max-width: 44rem; margin: 0 auto; padding: 4rem 1.5rem; }
          .label { font-family: "IBM Plex Mono", ui-monospace, monospace;
                   font-size: 0.6875rem; letter-spacing: 0.14em;
                   text-transform: uppercase; color: #8a6a2f; margin: 0 0 0.75rem; }
          h1 { font-size: 1.9rem; letter-spacing: -0.02em; margin: 0 0 1rem; }
          p { line-height: 1.7; color: #565045; margin: 0 0 1rem; }
          a { color: #235651; text-decoration: none; }
          a:hover { color: #b0355e; }
          .panel { background: #f4efe6;
                   border: 1px solid #e0d8ca; border-top-color: #b0355e;
                   border-radius: 0.75rem; padding: 1.25rem 1.5rem; margin: 1.5rem 0; }
          .url { font-family: "IBM Plex Mono", ui-monospace, monospace;
                 font-size: 0.85rem; color: #17150f; word-break: break-all; }
          .item { border-top: 1px solid #e0d8ca; padding: 1.25rem 0; }
          .item h2 { font-size: 1.05rem; margin: 0 0 0.4rem; }
          .item .date { font-family: "IBM Plex Mono", ui-monospace, monospace;
                        font-size: 0.7rem; color: #6f685b; }
          .items-head { margin-top: 2.5rem; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <p class="label">RSS feed · for feed readers</p>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p><xsl:value-of select="/rss/channel/description"/></p>
          <div class="panel">
            <p style="margin-bottom: 0.5rem;">
              <strong style="color: #17150f;">This is a feed, not a webpage.</strong>
              Subscribe by copying this address into any RSS reader
              (Feedly, NetNewsWire, Outlook, …) — new posts will arrive there automatically:
            </p>
            <p class="url" style="margin: 0;">https://appliediqsolutions.com/blog/rss.xml</p>
          </div>
          <p>
            Rather read it here? The same stream lives at
            <a href="/blog/">appliediqsolutions.com/blog</a>.
          </p>
          <p class="label items-head">Currently in the feed</p>
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <h2><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                <xsl:value-of select="title"/></a></h2>
              <p class="date"><xsl:value-of select="pubDate"/></p>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
