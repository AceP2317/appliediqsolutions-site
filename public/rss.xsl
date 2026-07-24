<?xml version="1.0" encoding="UTF-8"?>
<!--
  rss.xsl — browser-facing dress for the RSS feed. Feed READERS ignore this
  entirely (they parse the XML); browsers that support XSLT render the feed
  as a branded explainer page instead of a raw document tree. If a browser
  drops XSLT support (Chrome has deprecation plans), behavior degrades to
  the plain XML view — never worse than having no stylesheet at all.
  Brand tokens hardcoded from src/styles/global.css (this file renders
  standalone, outside the site's CSS pipeline).
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS feed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body { margin: 0; background: #0f1117; color: #e8eaf0;
                 font-family: Inter, ui-sans-serif, system-ui, sans-serif;
                 -webkit-font-smoothing: antialiased; }
          .wrap { max-width: 44rem; margin: 0 auto; padding: 4rem 1.5rem; }
          .label { font-family: "IBM Plex Mono", ui-monospace, monospace;
                   font-size: 0.6875rem; letter-spacing: 0.14em;
                   text-transform: uppercase; color: #c7a978; margin: 0 0 0.75rem; }
          h1 { font-size: 1.9rem; letter-spacing: -0.02em; margin: 0 0 1rem; }
          p { line-height: 1.7; color: #a4abbd; margin: 0 0 1rem; }
          a { color: #06b6d4; text-decoration: none; }
          a:hover { color: #22d3ee; }
          .panel { background: linear-gradient(160deg, #1d2230, #161a23);
                   border: 1px solid #262c3a; border-top-color: #39426a;
                   border-radius: 0.75rem; padding: 1.25rem 1.5rem; margin: 1.5rem 0; }
          .url { font-family: "IBM Plex Mono", ui-monospace, monospace;
                 font-size: 0.85rem; color: #e8eaf0; word-break: break-all; }
          .item { border-top: 1px solid #262c3a; padding: 1.25rem 0; }
          .item h2 { font-size: 1.05rem; margin: 0 0 0.4rem; }
          .item .date { font-family: "IBM Plex Mono", ui-monospace, monospace;
                        font-size: 0.7rem; color: #838b9e; }
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
              <strong style="color: #e8eaf0;">This is a feed, not a webpage.</strong>
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
