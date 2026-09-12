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
    config.SUPABASE_URL.replace(/\/+$/, ""),
    config.SUPABASE_PUBLISHABLE_KEY
  );


  /* =========================
     ELEMENTS
  ========================== */

  const homeView = $("homeView");
  const searchView = $("searchView");

  const navButtons =
    document.querySelectorAll(".nav-btn");

  const letterForm = $("letterForm");
  const searchForm = $("searchForm");

  const message = $("message");
  const messageCount = $("messageCount");

  const formStatus = $("formStatus");

  const results = $("results");
  const resultsMeta = $("resultsMeta");

  const musicSearch = $("musicSearch");
  const musicSearchBtn = $("musicSearchBtn");
  const musicStatus = $("musicStatus");
  const musicResults = $("musicResults");
  const selectedMusic = $("selectedMusic");

  const musicTitle = $("musicTitle");
  const musicArtist = $("musicArtist");
  const musicArtwork = $("musicArtwork");
  const musicUrl = $("musicUrl");
  const musicPreview = $("musicPreview");


  /* =========================
     FATAL ERROR
  ========================== */

  function showFatal(text) {

    const el =
      document.createElement("div");

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
     TIMEOUT HELPER
  ========================== */

  function withTimeout(
    promise,
    milliseconds,
    message
  ) {

    let timer;

    const timeout =
      new Promise((_, reject) => {

        timer = setTimeout(() => {

          reject(
            new Error(message)
          );

        }, milliseconds);

      });

    return Promise.race([
      promise,
      timeout
    ]).finally(() => {

      clearTimeout(timer);

    });
  }


  /* =========================
     SAFE HTTPS URL
  ========================== */

  function safeHttpsUrl(value) {

    if (!value) {
      return "";
    }

    try {

      const url =
        new URL(String(value).trim());

      if (url.protocol !== "https:") {
        return "";
      }

      return url.href;

    } catch {

      return "";

    }
  }


  /* =========================
     VIEW SWITCHING
  ========================== */

  function setView(view) {

    const isSearch =
      view === "search";

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
      top: 0,
      behavior: "smooth"
    });
  }


  document
    .querySelectorAll("[data-view]")
    .forEach((btn) => {

      btn.addEventListener(
        "click",
        (e) => {

          e.preventDefault();

          setView(
            btn.dataset.view
          );

        }
      );

    });


  /* =========================
     SCROLL TO FORM
  ========================== */

  const scrollToForm =
    $("scrollToForm");

  if (scrollToForm) {

    scrollToForm.addEventListener(
      "click",
      () => {

        const formWrap =
          $("letterFormWrap");

        if (formWrap) {

          formWrap.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

      }
    );

  }


  /* =========================
     MESSAGE COUNTER
  ========================== */

  if (message && messageCount) {

    message.addEventListener(
      "input",
      () => {

        messageCount.textContent =
          message.value.length;

      }
    );

  }


  /* =========================
     CLEAN TEXT
  ========================== */

  function cleanText(
    value,
    max
  ) {

    return String(value || "")
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

      url =
        new URL(
          raw.trim()
        );

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


    const allowed =
      new Set([
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
        .replace(
          /[^a-zA-Z0-9]/g,
          ""
        );


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

    return String(value || "").replace(
      /[&<>"']/g,
      (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[ch])
    );

  }


  /* =========================
     DATE
  ========================== */

  function formatDate(value) {

    const d =
      new Date(value);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {

      return "";

    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    ).format(d);

  }


  /* =========================
     MUSIC SEARCH
  ========================== */

  async function searchMusic() {

    const query =
      musicSearch.value.trim();


    if (!query) {

      musicStatus.textContent =
        "Type a song or artist first.";

      musicResults.innerHTML = "";

      return;

    }


    musicSearchBtn.disabled = true;

    musicSearchBtn.textContent =
      "Searching…";

    musicStatus.textContent =
      "Looking through the music library…";

    musicResults.innerHTML = "";


    try {

      const functionUrl =
        `${config.SUPABASE_URL.replace(/\/+$/, "")}` +
        `/functions/v1/search-music`;


      const controller =
        new AbortController();


      const timeout =
        setTimeout(() => {

          controller.abort();

        }, 10000);


      let response;

      try {

        response =
          await fetch(
            functionUrl,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "apikey":
                  config.SUPABASE_PUBLISHABLE_KEY,

                "Authorization":
                  `Bearer ${config.SUPABASE_PUBLISHABLE_KEY}`
              },

              body: JSON.stringify({
                query:
                  query.slice(0, 100)
              }),

              signal:
                controller.signal
            }
          );

      } finally {

        clearTimeout(timeout);

      }


      let data = null;

      try {

        data =
          await response.json();

      } catch {

        throw new Error(
          "The music service returned an invalid response."
        );

      }


      if (!response.ok) {

        throw new Error(
          data?.error ||
          `Music search failed (${response.status}).`
        );

      }


      if (
        !data ||
        !Array.isArray(data.results)
      ) {

        throw new Error(
          "The music service returned an unexpected response."
        );

      }


      if (!data.results.length) {

        musicStatus.textContent =
          "No songs found. Try another search.";

        musicResults.innerHTML = "";

        return;

      }


      musicStatus.textContent =
        `${data.results.length} results found.`;

      renderMusicResults(
        data.results
      );

    } catch (error) {

      console.error(
        "MUSIC SEARCH ERROR:",
        error
      );


      if (
        error &&
        error.name === "AbortError"
      ) {

        musicStatus.textContent =
          "Music search timed out. Please try again.";

      } else {

        musicStatus.textContent =
          error?.message ||
          "Couldn't search for music right now.";

      }

      musicResults.innerHTML = "";

    } finally {

      musicSearchBtn.disabled = false;

      musicSearchBtn.textContent =
        "Search";

    }

  }


  /* =========================
     RENDER MUSIC RESULTS
  ========================== */

  function renderMusicResults(
    tracks
  ) {

    musicResults.innerHTML = "";


    tracks.forEach((track) => {

      const item =
        document.createElement("div");

      item.className =
        "music-result";


      const artwork =
        safeHttpsUrl(
          track.artwork
        );


      item.innerHTML = `
        ${
          artwork
            ? `
              <img
                class="music-artwork"
                src="${escapeHtml(artwork)}"
                alt=""
                loading="lazy"
              >
            `
            : `
              <div class="music-artwork"></div>
            `
        }

        <div class="music-info">

          <div class="music-title">
            ${escapeHtml(
              track.title
            )}
          </div>

          <div class="music-artist">
            ${escapeHtml(
              track.artist
            )}
          </div>

          ${
            track.album
              ? `
                <div class="music-album">
                  ${escapeHtml(
                    track.album
                  )}
                </div>
              `
              : ""
          }

        </div>

        <button
          class="music-select"
          type="button"
        >
          Select
        </button>
      `;


      const selectButton =
        item.querySelector(
          ".music-select"
        );


      if (selectButton) {

        selectButton.addEventListener(
          "click",
          () => {

            selectMusic(track);

          }
        );

      }


      musicResults.appendChild(
        item
      );

    });

  }


  /* =========================
     SELECT MUSIC
  ========================== */

  function selectMusic(
    track
  ) {

    musicTitle.value =
      track.title || "";

    musicArtist.value =
      track.artist || "";

    musicArtwork.value =
      safeHttpsUrl(
        track.artwork
      );

    musicUrl.value =
      safeHttpsUrl(
        track.url
      );

    musicPreview.value =
      safeHttpsUrl(
        track.preview
      );


    const artwork =
      safeHttpsUrl(
        track.artwork
      );


    selectedMusic.innerHTML = `
      ${
        artwork
          ? `
            <img
              class="music-artwork"
              src="${escapeHtml(artwork)}"
              alt=""
            >
          `
          : `
            <div class="music-artwork"></div>
          `
      }

      <div class="selected-music-info">

        <div class="selected-label">
          Selected song
        </div>

        <div class="music-title">
          ${escapeHtml(
            track.title
          )}
        </div>

        <div class="music-artist">
          ${escapeHtml(
            track.artist
          )}
        </div>

      </div>

      <button
        class="remove-music"
        type="button"
      >
        Remove
      </button>
    `;


    selectedMusic.classList.add(
      "show"
    );


    musicResults.innerHTML = "";


    musicStatus.textContent =
      "Song selected. ✦";


    const removeButton =
      selectedMusic.querySelector(
        ".remove-music"
      );


    if (removeButton) {

      removeButton.addEventListener(
        "click",
        clearSelectedMusic
      );

    }

  }


  /* =========================
     CLEAR SELECTED MUSIC
  ========================== */

  function clearSelectedMusic() {

    musicTitle.value = "";
    musicArtist.value = "";
    musicArtwork.value = "";
    musicUrl.value = "";
    musicPreview.value = "";

    selectedMusic.innerHTML = "";

    selectedMusic.classList.remove(
      "show"
    );

    musicStatus.textContent = "";

  }


  /* =========================
     MUSIC EVENTS
  ========================== */

  if (
    musicSearchBtn &&
    musicSearch
  ) {

    musicSearchBtn.addEventListener(
      "click",
      searchMusic
    );


    musicSearch.addEventListener(
      "keydown",
      (e) => {

        if (e.key === "Enter") {

          e.preventDefault();

          searchMusic();

        }

      }
    );

  }


  /* =========================
     RENDER LETTER
  ========================== */

  function renderCard(row) {

    const card =
      document.createElement("article");

    card.className =
      "card";


    const to =
      escapeHtml(
        row.to_name
      );


    const from =
      row.from_name
        ? escapeHtml(
            row.from_name
          )
        : "Anonymous";


    const letter =
      escapeHtml(
        row.message
      );


    let musicHtml = "";


    /* =========================
       DEEZER MUSIC
    ========================== */

    if (
      row.music_title ||
      row.music_artist ||
      row.music_preview
    ) {

      const artwork =
        safeHttpsUrl(
          row.music_artwork
        );

      const musicLink =
        safeHttpsUrl(
          row.music_url
        );

      const preview =
        safeHttpsUrl(
          row.music_preview
        );


      musicHtml = `
        <div class="card-music">

          <div class="card-music-top">

            ${
              artwork
                ? `
                  <img
                    class="card-music-artwork"
                    src="${escapeHtml(artwork)}"
                    alt=""
                    loading="lazy"
                  >
                `
                : ""
            }

            <div class="card-music-info">

              <div class="card-music-title">
                ${escapeHtml(
                  row.music_title ||
                  "Unknown song"
                )}
              </div>

              <div class="card-music-artist">
                ${escapeHtml(
                  row.music_artist ||
                  "Unknown artist"
                )}
              </div>

            </div>

            ${
              musicLink
                ? `
                  <a
                    class="card-music-link"
                    href="${escapeHtml(musicLink)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open ↗
                  </a>
                `
                : ""
            }

          </div>

          ${
            preview
              ? `
                <audio
                  controls
                  preload="none"
                  src="${escapeHtml(preview)}"
                ></audio>
              `
              : ""
          }

        </div>
      `;

    }


    /* =========================
       OLD SPOTIFY MUSIC
    ========================== */

    else if (
      row.spotify_url
    ) {

      const spotify =
        spotifyEmbedUrl(
          row.spotify_url
        );


      if (spotify) {

        musicHtml = `
          <div class="spotify">

            <iframe
              src="${spotify}"
              title="Spotify player"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            ></iframe>

          </div>
        `;

      }

    }


    /* =========================
       CARD HTML
    ========================== */

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

      ${musicHtml}

      <div class="date">
        ${formatDate(
          row.created_at
        )}
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


      formStatus.className =
        "status";

      formStatus.textContent =
        "";


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


      if (
        !toName ||
        !msg
      ) {

        return setStatus(
          "Please fill in the recipient and your letter.",
          true
        );

      }


      const submitBtn =
        $("submitBtn");


      submitBtn.disabled =
        true;

      submitBtn.textContent =
        "Sending into the universe…";


      try {

        const musicData = {
          music_title:
            cleanText(
              musicTitle.value,
              200
            ) || null,

          music_artist:
            cleanText(
              musicArtist.value,
              200
            ) || null,

          music_artwork:
            safeHttpsUrl(
              musicArtwork.value
            ) || null,

          music_url:
            safeHttpsUrl(
              musicUrl.value
            ) || null,

          music_preview:
            safeHttpsUrl(
              musicPreview.value
            ) || null
        };


        const insertPromise =
          db
            .from("letters")
            .insert({
              to_name:
                toName,

              from_name:
                fromName ||
                null,

              message:
                msg,

              spotify_url:
                null,

              music_title:
                musicData.music_title,

              music_artist:
                musicData.music_artist,

              music_artwork:
                musicData.music_artwork,

              music_url:
                musicData.music_url,

              music_preview:
                musicData.music_preview
            });


        const result =
          await withTimeout(
            insertPromise,
            10000,
            "Posting the letter timed out. Please try again."
          );


        if (result.error) {

          console.error(
            "SUPABASE ERROR:",
            result.error
          );

          throw new Error(
            result.error.message ||
            "Unable to post your letter."
          );

        }


        letterForm.reset();


        messageCount.textContent =
          "0";


        clearSelectedMusic();


        musicResults.innerHTML = "";

        musicStatus.textContent =
          "";


        setStatus(
          "Your letter is out there. ✦",
          false
        );


        showToast(
          "Letter posted ✦"
        );


        setTimeout(
          () => {

            const searchName =
              $("searchName");


            if (searchName) {

              searchName.value =
                toName;

            }


            setView(
              "search"
            );


            searchFor(
              toName
            );

          },
          700
        );


      } catch (error) {

        console.error(
          "POST LETTER ERROR:",
          error
        );


        setStatus(
          error?.message ||
          "Couldn't post your letter right now. Please try again.",
          true
        );

      } finally {

        submitBtn.disabled =
          false;

        submitBtn.textContent =
          "Post this letter ✦";

      }

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

        await searchFor(
          name
        );

      }

    }
  );


  /* =========================
     SEARCH DATABASE
  ========================== */

  async function searchFor(
    name
  ) {

    results.innerHTML = `
      <div class="empty">
        Looking among the stars…
      </div>
    `;


    resultsMeta.textContent =
      "";


    try {

      const searchPromise =
        db
          .from("letters")
          .select(
            [
              "id",
              "to_name",
              "from_name",
              "message",
              "spotify_url",
              "created_at",
              "music_title",
              "music_artist",
              "music_artwork",
              "music_url",
              "music_preview"
            ].join(",")
          )
          .eq(
            "recipient_key",
            name.toLowerCase()
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(100);


      const result =
        await withTimeout(
          searchPromise,
          10000,
          "Search timed out. Please try again."
        );


      const data =
        result.data;

      const error =
        result.error;


      if (error) {

        console.error(
          "SEARCH ERROR:",
          error
        );

        throw new Error(
          error.message ||
          "Couldn't search right now."
        );

      }


      resultsMeta.textContent =
        data.length
          ? `${data.length} letter${
              data.length === 1
                ? ""
                : "s"
            } written for “${name}”`
          : `No public letters found for “${name}” yet.`;


      results.innerHTML =
        "";


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


    } catch (error) {

      console.error(
        "SEARCH DATABASE ERROR:",
        error
      );


      resultsMeta.textContent =
        "";


      results.innerHTML = `
        <div class="empty">
          ${
            error?.message ||
            "Couldn't search right now. Please try again."
          }
        </div>
      `;

    }

  }


  /* =========================
     TOAST
  ========================== */

  function showToast(
    text
  ) {

    const toast =
      $("toast");


    if (!toast) {
      return;
    }


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
