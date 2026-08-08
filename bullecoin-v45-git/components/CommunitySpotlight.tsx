"use client";

export default function CommunitySpotlight() {
  return (
    <section className="spotlightSection" id="community-video">
      <div className="contentWidth">
        <p className="sectionLabel">05 / COMMUNITY SPOTLIGHT</p>

        <div className="spotlightGrid">
          <div className="spotlightCopy">
            <h2>THE HERD<span>IS FORMING.</span></h2>

            <p>
              Traders, builders, gamers, creators and meme makers are welcome.
              BULLE is being built in public with a community-first vision.
            </p>

            <div className="spotlightActions">
              <a href="https://x.com/BulleCoinOF" target="_blank" rel="noreferrer">
                WATCH & FOLLOW ON X
              </a>
              <a href="https://t.me/+k7ieRmAdKgpmNjcx" target="_blank" rel="noreferrer">
                JOIN TELEGRAM
              </a>
            </div>

            <div className="spotlightTags">
              <span>TRADERS</span><span>BUILDERS</span>
              <span>CREATORS</span><span>GAMERS</span>
            </div>
          </div>

          <div className="spotlightMedia">
            <img src="/community-poster.png" alt="The BULLE community is forming" />
            <div className="spotlightMediaOverlay">
              <span>COMMUNITY FILM</span>
              <strong>THE HERD IS FORMING</strong>
              <small>Official community campaign.</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
