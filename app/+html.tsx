import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Web-only HTML shell for Expo Router.
 *
 * The inline <script> runs synchronously before React hydrates,
 * applying the saved color scheme immediately to avoid a white flash
 * when reloading in dark mode.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* Eliminates scroll-bounce background artifacts on iOS Safari */}
        <ScrollViewStyleReset />

        {/*
          Anti-flash script: reads localStorage synchronously before
          the first paint and applies the dark class + background color.
          Must be a blocking script (no defer/async) to run before paint.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var scheme = localStorage.getItem('color_scheme');
                  if (scheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = '#030712';
                    document.body && (document.body.style.backgroundColor = '#030712');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
