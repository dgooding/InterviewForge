import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * OAuth / magic-link return URL.
 * Exchanges ?code= for a session using cookies (PKCE verifier).
 * Cookies are written onto the redirect Response so the browser keeps the session.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const oauthError =
    searchParams.get("error_description") || searchParams.get("error");
  const nextRaw = searchParams.get("next") || "/dashboard";
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard";

  const origin = getOrigin(request, requestUrl);

  if (oauthError) {
    const msg = encodeURIComponent(String(oauthError).slice(0, 200));
    return NextResponse.redirect(
      `${origin}/login?error=oauth&message=${msg}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=callback&message=${encodeURIComponent(
        "Missing auth code. Try signing in again."
      )}`
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      `${origin}/login?error=callback&message=${encodeURIComponent(
        "Cloud auth is not configured on this deployment."
      )}`
    );
  }

  // Build redirect first so setAll can attach Set-Cookie headers to it.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=callback&message=${encodeURIComponent(
        error.message.slice(0, 200)
      )}`
    );
  }

  return response;
}

function getOrigin(request: NextRequest, requestUrl: URL): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      /* fall through */
    }
  }
  return requestUrl.origin;
}
