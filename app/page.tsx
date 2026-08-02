import Image from "next/image";

const xUrl = "https://x.com/BulleCoinOF";
const telegramUrl = "https://t.me/+k7ieRmAdKgpmNjcx";

export default function Home() {
  return (
    <main>
      <header className="navbar">
        <a href="#home" className="brand">
          <Image src="/bulle-logo.jpg" alt="BULLE official logo" width={52} height={52} priority />
          <div>
            <strong>BULLE</strong>
            <span>The Cyber Bull of Solana</span>
          </div>
        </a>

        <nav>
          <a href="#about">About</a>
          <a href="#tokenomics">Tokenomics</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#community">Community</a>
        </nav>

        <a href={telegramUrl} target="_blank" rel="noreferrer" className="navButton heroButton">
          Join the herd
        </a>
      </header>

      <section className="hero" id="home">
        <div className="heroContent">
          <p className="eyebrow">BUILT FOR THE BULL MARKET</p>
          <h1 className="heroTitle">
            THE <span>CYBER</span>
            <br />
            <span>BULL</span> OF
            <br />
            SOLANA
          </h1>
          <p className="description">
            BULLE is a community-first Web3 brand built around transparency,
            identity and the future of the Solana ecosystem.
          </p>
          <p className="slogan">
            Stronger Community. <strong>Stronger Future.</strong>
          </p>
          <div className="actions">
            <button type="button" disabled>BUY BULLE — COMING SOON</button>
            <a href={telegramUrl} target="_blank" rel="noreferrer">JOIN TELEGRAM</a>
          </div>
          <div className="securityNotice">
            <span>OFFICIAL CONTRACT</span>
            <strong>NOT LAUNCHED YET</strong>
            <p>Only trust the contract published on bullecoin.io and our official social accounts.</p>
          </div>
        </div>

        <div className="heroVisual">
          <div className="glow" />
          <div className="orbit orbitOne" />
          <div className="orbit orbitTwo" />
          <Image className="heroLogo" src="/bulle-logo.jpg" alt="Official BULLE token emblem" width={700} height={700} priority />
        </div>
      </section>

      <section className="ticker" aria-label="BULLE values">
        <div>
          <span>🐂 BULL MARKET LOADING...</span><span>COMMUNITY FIRST</span><span>TRANSPARENT</span><span>BUILT ON SOLANA</span><span>STRONGER TOGETHER</span>
          <span>🐂 BULL MARKET LOADING...</span><span>COMMUNITY FIRST</span><span>TRANSPARENT</span><span>BUILT ON SOLANA</span><span>STRONGER TOGETHER</span>
        </div>
      </section>

      <section className="aboutSection" id="about">
        <div className="contentWidth">
          <p className="sectionLabel">01 / ABOUT</p>
          <div className="aboutGrid">
            <div className="aboutIntro">
              <h2>BUILT FOR THE<br />NEXT GENERATION<span>OF SOLANA.</span></h2>
              <p>BULLE is a community-first Web3 project built around transparency, strong branding and long-term development.</p>
              <p>Our goal is to unite a strong community while building useful tools and a recognizable identity inside the Solana ecosystem.</p>
            </div>
            <div className="aboutCards">
              <article><span>01</span><h3>COMMUNITY FIRST</h3><p>Built with the herd and designed for community growth.</p></article>
              <article><span>02</span><h3>TRANSPARENT</h3><p>Official wallets, contracts and updates will be publicly verifiable.</p></article>
              <article><span>03</span><h3>ZERO HIDDEN TAX</h3><p>Launch mechanics will be clearly disclosed before release.</p></article>
              <article><span>04</span><h3>BUILT ON SOLANA</h3><p>Fast, scalable and designed for the Solana ecosystem.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section className="tokenomicsSection" id="tokenomics">
        <div className="contentWidth">
          <p className="sectionLabel">02 / TOKENOMICS</p>
          <div className="tokenomicsHeader">
            <h2>SIMPLE.<br />TRANSPARENT.<span>VERIFIABLE.</span></h2>
            <div className="launchStatus">
              <span>STATUS</span>
              <strong>TOKEN NOT LAUNCHED YET</strong>
              <p>Final supply, liquidity allocation and launch mechanics will be published before the official release.</p>
              <small>Do not interact with tokens claiming to be BULLE until the verified contract is published on bullecoin.io.</small>
            </div>
          </div>

          <div className="allocationGrid">
            <article className="allocationCard"><div className="allocationTop"><span>01</span><strong>50%</strong></div><h3>LIQUIDITY</h3><p>Initial liquidity and pool information published on-chain.</p><div className="allocationBar"><i style={{ width: "50%" }} /></div></article>
            <article className="allocationCard"><div className="allocationTop"><span>02</span><strong>20%</strong></div><h3>COMMUNITY</h3><p>Community campaigns, rewards and participation programs.</p><div className="allocationBar"><i style={{ width: "20%" }} /></div></article>
            <article className="allocationCard"><div className="allocationTop"><span>03</span><strong>10%</strong></div><h3>MARKETING</h3><p>Content, collaborations, listings and project visibility.</p><div className="allocationBar"><i style={{ width: "10%" }} /></div></article>
            <article className="allocationCard"><div className="allocationTop"><span>04</span><strong>10%</strong></div><h3>TREASURY</h3><p>Public treasury for ecosystem growth and initiatives.</p><div className="allocationBar"><i style={{ width: "10%" }} /></div></article>
            <article className="allocationCard"><div className="allocationTop"><span>05</span><strong>5%</strong></div><h3>DEVELOPMENT</h3><p>Website, Bull Hub, integrations and future utility.</p><div className="allocationBar"><i style={{ width: "5%" }} /></div></article>
            <article className="allocationCard"><div className="allocationTop"><span>06</span><strong>5%</strong></div><h3>TEAM — VESTED</h3><p>Any team allocation must use transparent vesting.</p><div className="allocationBar"><i style={{ width: "5%" }} /></div></article>
          </div>

          <div className="tokenFacts">
            <article><small>NETWORK</small><strong>SOLANA</strong></article>
            <article><small>TRANSACTION TAX</small><strong>0% PLANNED</strong></article>
            <article><small>CONTRACT</small><strong>COMING SOON</strong></article>
            <article><small>VERIFICATION</small><strong>BULLECOIN.IO</strong></article>
          </div>

          <p className="tokenomicsDisclaimer">Draft allocation for discussion only. Percentages and launch mechanics may change before the official token creation.</p>
        </div>
      </section>

     <section className="roadmapSection" id="roadmap">
  <div className="contentWidth">
    <p className="sectionLabel">03 / ROADMAP</p>

    <div className="roadmapHeader">
      <h2>
        FROM SYMBOL
        <span>TO ECOSYSTEM.</span>
      </h2>

      <p>
        BULLE begins with a recognizable identity and grows through community,
        transparency and useful tools for the Solana ecosystem.
      </p>
    </div>

    <div className="roadmapTimeline">
      <article className="roadmapStep active">
        <div className="roadmapPoint">01</div>
        <small>PHASE 01</small>
        <h3>IGNITION</h3>
        <p>
          Official identity, website, X, Telegram and community foundation.
        </p>
        <span className="roadmapStatus">IN PROGRESS</span>
      </article>

      <article className="roadmapStep">
        <div className="roadmapPoint">02</div>
        <small>PHASE 02</small>
        <h3>LAUNCH</h3>
        <p>
          Verified token creation, contract publication and launch campaign.
        </p>
        <span className="roadmapStatus">NEXT</span>
      </article>

      <article className="roadmapStep">
        <div className="roadmapPoint">03</div>
        <small>PHASE 03</small>
        <h3>BULL HUB</h3>
        <p>
          Community dashboard, educational resources and Solana discovery tools.
        </p>
        <span className="roadmapStatus">PLANNED</span>
      </article>

      <article className="roadmapStep">
        <div className="roadmapPoint">04</div>
        <small>PHASE 04</small>
        <h3>EXPANSION</h3>
        <p>
          Partnerships, treasury reporting and future community utilities.
        </p>
        <span className="roadmapStatus">FUTURE</span>
      </article>
    </div>
  </div>
</section>

      <section className="communitySection" id="community">
  <div className="contentWidth communityGrid">
    <div className="communityCopy">
      <p className="sectionLabel">04 / COMMUNITY</p>

      <h2>
        JOIN
        <span>THE HERD.</span>
      </h2>

      <p>
        Stronger Community. Stronger Future. Follow only the official BULLE
        channels for verified launch information, updates and announcements.
      </p>

      <div className="socialLinks">
        <a href={xUrl} target="_blank" rel="noreferrer">
          <small>FOLLOW ON</small>
          <strong>X / @BulleCoinOF</strong>
        </a>

        <a href={telegramUrl} target="_blank" rel="noreferrer">
          <small>JOIN THE</small>
          <strong>TELEGRAM CHANNEL</strong>
        </a>
      </div>
    </div>

    <div className="communityVisual">
      <div className="communityGlow" />

      <Image
        src="/bulle-logo.jpg"
        alt="BULLE community emblem"
        width={500}
        height={500}
      />

      <div className="communityBadge">
        <span>OFFICIAL COMMUNITY</span>
        <strong>STRONGER TOGETHER</strong>
      </div>
    </div>
  </div>
</section>

<footer className="siteFooter">
  <div className="contentWidth footerTop">
    <div className="footerBrand">
      <Image
        src="/bulle-logo.jpg"
        alt="BULLE logo"
        width={58}
        height={58}
      />

      <div>
        <strong>BULLE</strong>
        <span>The Cyber Bull of Solana</span>
      </div>
    </div>

    <div className="footerLinks">
      <div>
        <small>NAVIGATION</small>
        <a href="#about">About</a>
        <a href="#tokenomics">Tokenomics</a>
        <a href="#roadmap">Roadmap</a>
      </div>

      <div>
        <small>OFFICIAL LINKS</small>
        <a href={xUrl} target="_blank" rel="noreferrer">
          X / Twitter
        </a>
        <a href={telegramUrl} target="_blank" rel="noreferrer">
          Telegram
        </a>
        <a href="https://bullecoin.io">bullecoin.io</a>
      </div>
    </div>
  </div>

  <div className="contentWidth footerBottom">
    <p>© 2026 BULLE. All rights reserved.</p>

    <p>
      Crypto assets involve substantial risk. Nothing on this website is
      financial advice, a guarantee or a promise of profit. Always verify
      official links and contract addresses.
    </p>
  </div>
</footer>
    </main>
  );
}
