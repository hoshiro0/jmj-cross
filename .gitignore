(() => {
  "use strict";

  const config = window.STARLETTERS_CONFIG || {};

  const $ = (id) => document.getElementById(id);


  /* =========================
     CHECK SUPABASE
  ========================== */

  if (!window.supabase) {
    showFatal(
      "Supabase library could not load. Check your internet connection."
    );

    return;
  }


  /* =========================
     CHECK CONFIG
  ========================== */

  if (
    !config.SUPABASE_URL ||
    config.SUPABASE_URL.includes("PASTE_") ||
    !config.SUPABASE_PUBLISHABLE_KEY ||
    config.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
  ) {
    showFatal(
      "Open config.js and add your Supabase URL + publishable key first."
    );

    return;
  }


  /* =========================
     SUPABASE CLIENT
  ========================== */

  const db = window.supabase.createClient(
    config.SUPABASE_URL,
    config.SUPABASE_PUBLISHABLE_KEY
  );


  /* =========================
     ELEMENTS
  ========================== */

  const homeView = $("homeView");
  const searchView = $("searchView");

  const navButtons = document.querySelectorAll(".nav-btn");

  const letterForm = $("letterForm");
  const searchForm = $("searchForm");

  const message = $("message");
  const messageCount = $("messageCount");

  const formStatus = $("formStatus");

  const results = $("results");
  const resultsMeta = $("resultsMeta");


  /* =========================
     FATAL ERROR
  ========================== */

  function showFatal(text) {

    const el = document.createElement("div");

    el.style.cssText =
      "position:fixed;" +
      "inset:20px;" +
      "z-index:999;" +
      "background:#171329;" +
      "color:#fff;" +
      "padding:24px;" +
      "border:1px solid #8d79c9;" +
      "border-radius:18px;" +
      "font:14px/1.6 sans-serif;" +
      "height:max-content;";

    el.textContent = text;

    document.body.appendChild(el);
  }


  /* =========================
     VIEW SWITCHING
  ========================== */

  function setView(view) {

    const isSearch = view === "search";

    homeView.classList.toggle(
      "active",
      !isSearch
    );

    searchView.classList.toggle(
      "active",
      isSearch
    );

    navButtons.forEach((btn) => {

      btn.classList.toggle(
        "active",
        btn.dataset.view === view
      );

    });

    window.scrollTo({
      top:0,
      behavior:"smooth"
    });
  }


  document
    .querySelectorAll("[data-view]")
    .forEach((btn) => {

      btn.addEventListener("click", (e) => {

        e.preventDefault();

        setView(btn.dataset.view);

      });

    });


  /* =========================
     SCROLL TO FORM
  ========================== */

  $("scrollToForm").addEventListener(
    "click",
    () => {

      $("letterFormWrap").scrollIntoView({
        behavior:"smooth",
        block:"start"
      });

    }
  );


  /* =========================
     MESSAGE COUNTER
  ========================== */

  message.addEventListener(
    "input",
    () => {

      messageCount.textContent =
        message.value.length;

    }
  );


  /* =========================
     CLEAN TEXT
  ========================== */

  function cleanText(value, max) {

    return value
      .trim()
      .replace(/\s+\n/g, "\n")
      .slice(0, max);

  }


  /* =========================
     SPOTIFY
  ========================== */

  function spotifyEmbedUrl(raw) {

    if (!raw) {
      return null;
    }

    let url;

    try {

      url = new URL(raw.trim());

    } catch {

      return null;

    }


    if (
      ![
        "open.spotify.com",
        "spotify.com"
      ].includes(url.hostname)
    ) {

      return null;

    }


    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);


    if (parts.length < 2) {
      return null;
    }


    const allowed = new Set([
      "track",
      "album",
      "playlist",
      "artist",
      "episode",
      "show"
    ]);


    if (!allowed.has(parts[0])) {
      return null;
    }


    const id =
      parts[1]
        .replace(/[^a-zA-Z0-9]/g, "");


    if (!id) {
      return null;
    }


    return (
      `https://open.spotify.com/embed/` +
      `${parts[0]}/${id}?utm_source=starletters`
    );
  }


  /* =========================
     HTML ESCAPE
  ========================== */

  function escapeHtml(value) {

    return String(value).replace(
      /[&<>"']/g,
      (ch) => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[ch])
    );

  }


  /* =========================
     DATE
  ========================== */

  function formatDate(value) {

    const d = new Date(value);

    return new Intl.DateTimeFormat(
      undefined,
      {
        year:"numeric",
        month:"short",
        day:"numeric"
      }
    ).format(d);

  }


  /* =========================
     RENDER LETTER
  ========================== */

  function renderCard(row) {

    const card =
      document.createElement("article");

    card.className = "card";


    const to =
      escapeHtml(row.to_name);


    const from =
      row.from_name
        ? escapeHtml(row.from_name)
        : "Anonymous";


    const letter =
      escapeHtml(row.message);


    const spotify =
      row.spotify_url
        ? spotifyEmbedUrl(row.spotify_url)
        : null;


    card.innerHTML = `
      <div class="card-top">

        <div class="to">
          To ${to}
        </div>

        <div class="from">
          from ${from}
        </div>

      </div>

      <div class="letter">
        ${letter}
      </div>

      ${
        spotify
          ? `
            <div class="spotify">

              <iframe
                src="${spotify}"
                title="Spotify player"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              ></iframe>

            </div>
          `
          : ""
      }

      <div class="date">
        ${formatDate(row.created_at)}
      </div>
    `;


    return card;
  }


  /* =========================
     POST LETTER
  ========================== */

  letterForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      formStatus.className = "status";
      formStatus.textContent = "";


      const toName =
        cleanText(
          $("toName").value,
          80
        );


      const fromName =
        cleanText(
          $("fromName").value,
          80
        );


      const msg =
        cleanText(
          message.value,
          5000
        );


      const spotifyRaw =
        cleanText(
          $("spotifyUrl").value,
          500
        );


      const spotify =
        spotifyEmbedUrl(spotifyRaw);


      if (!toName || !msg) {

        return setStatus(
          "Please fill in the recipient and your letter.",
          true
        );

      }


      if (spotifyRaw && !spotify) {

        return setStatus(
          "That doesn't look like a valid Spotify content link.",
          true
        );

      }


      const submitBtn =
        $("submitBtn");


      submitBtn.disabled = true;

      submitBtn.textContent =
        "Sending into the universe…";


      const {
        error
      } = await db
        .from("letters")
        .insert({

          to_name:toName,

          from_name:
            fromName || null,

          message:msg,

          spotify_url:
            spotifyRaw || null

        });


      submitBtn.disabled = false;

      submitBtn.textContent =
        "Post this letter ✦";


      if (error) {

        console.error(error);


        return setStatus(

          error.message
            .toLowerCase()
            .includes("row-level security")

            ? "Posting is blocked by your database policy. Run the complete supabase.sql setup."

            : "Something went wrong while posting. Check your Supabase setup.",

          true

        );

      }


      letterForm.reset();

      messageCount.textContent =
        "0";


      setStatus(
        "Your letter is out there. ✦",
        false
      );


      showToast(
        "Letter posted ✦"
      );


      setTimeout(
        () => {

          $("searchName").value =
            toName;

          setView("search");

          searchFor(toName);

        },
        700
      );

    }
  );


  /* =========================
     FORM STATUS
  ========================== */

  function setStatus(
    text,
    error
  ) {

    formStatus.textContent =
      text;

    formStatus.className =
      "status " +
      (
        error
          ? "error"
          : "success"
      );

  }


  /* =========================
     SEARCH FORM
  ========================== */

  searchForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      const name =
        cleanText(
          $("searchName").value,
          80
        );


      if (name) {

        await searchFor(name);

      }

    }
  );


  /* =========================
     SEARCH DATABASE
  ========================== */

  async function searchFor(name) {

    results.innerHTML = `
      <div class="empty">
        Looking among the stars…
      </div>
    `;

    resultsMeta.textContent = "";


    const {
      data,
      error
    } = await db
      .from("letters")
      .select(
        "id,to_name,from_name,message,spotify_url,created_at"
      )
      .eq(
        "recipient_key",
        name.toLowerCase()
      )
      .order(
        "created_at",
        {
          ascending:false
        }
      )
      .limit(100);


    if (error) {

      console.error(error);


      results.innerHTML = `
        <div class="empty">
          Couldn't search right now.
          Check your Supabase table/RLS setup.
        </div>
      `;

      return;
    }


    resultsMeta.textContent =
      data.length

        ? `${data.length} letter${
            data.length === 1
              ? ""
              : "s"
          } written for “${name}”`

        : `No public letters found for “${name}” yet.`;


    results.innerHTML = "";


    if (!data.length) {

      results.innerHTML = `
        <div class="empty">
          Nothing here yet.<br>
          Maybe someone is still trying to find the words.
        </div>
      `;

      return;
    }


    const fragment =
      document.createDocumentFragment();


    data.forEach(
      (row) => {

        fragment.appendChild(
          renderCard(row)
        );

      }
    );


    results.appendChild(
      fragment
    );

  }


  /* =========================
     TOAST
  ========================== */

  function showToast(text) {

    const toast =
      $("toast");


    toast.textContent =
      text;


    toast.classList.add(
      "show"
    );


    clearTimeout(
      showToast.timer
    );


    showToast.timer =
      setTimeout(
        () => {

          toast.classList.remove(
            "show"
          );

        },
        2800
      );

  }

})();
