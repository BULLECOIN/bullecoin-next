import Image from "next/image";

const xUrl = "https://x.com/BulleCoinOF";
const telegramUrl = "https://t.me/+k7ieRmAdKgpmNjcx";

export default function Home() {
  return (
    <main>
      <header className="navbar">
        <a href="#home" className="brand">
          <Image
            src="/bulle-logo.jpg"
            alt="BULLE logo"
            width={52}
            height={52}
            priority
          />

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

        <a href="#community" className="navButton">
          Join the herd
        </a>
      </header>

      <section className="hero" id="home">
        <div className="heroContent">
          <p className="eyebrow">BUILT FOR THE BULL MARKET</p>

          <h1>
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
            <button type="button" disabled>
              BUY BULLE — COMING SOON
            </button>

            <a href={telegramUrl} target="_blank" rel="noreferrer">
              JOIN TELEGRAM
            </a>
          </div>

          <div className="securityNotice">
            <span>OFFICIAL CONTRACT</span>
            <strong>NOT LAUNCHED YET</strong>
            <p>
              Only trust the contract published on bullecoin.io and our official
              social accounts.
            </p>
          </div>
        </div>

        <div className="heroVisual">
          <div className="glow" />
          <div className="orbit orbitOne" />
          <div className="orbit orbitTwo" />

          <Image
            className="heroLogo"
            src="/bulle-logo.jpg"
            alt="Official BULLE token emblem"
            width={700}
            height={700}
            priority
          />
        </div>
      </section>

      <section className="ticker">
        <div>
          <span>🐂 BULL MARKET LOADING...</span>
          <span>COMMUNITY FIRST</span>
          <span>TRANSPARENT</span>
          <span>BUILT ON SOLANA</span>
          <span>STRONGER TOGETHER</span>
          <span>🐂 BULL MARKET LOADING...</span>
        </div>
      </section>

      <section className="infoSection" id="about">
        <p className="sectionLabel">01 / ABOUT</p>

        <div className="sectionGrid">
          <h2>
            MORE THAN A MEME.
            <span>A BRAND WITH A MISSION.</span>
          </h2>

          <div className="sectionText">
            <p>
              BULLE combines a recognizable cyber-bull identity with a
              community-first approach and transparent public communication.
            </p>

            <p>
              Official addresses, launch information and project updates will
              always be published through verified BULLE channels.
            </p>
          </div>
        </div>

        <div className="cards">
          <article>
            <span>01</span>
            <h3>COMMUNITY FIRST</h3>
            <p>Built with the herd and for the herd.</p>
          </article>

          <article>
            <span>02</span>
            <h3>TRANSPARENT</h3>
            <p>Official information and wallets will be publicly verifiable.</p>
          </article>

          <article>
            <span>03</span>
            <h3>SOLANA POWERED</h3>
            <p>Designed to grow inside the Solana ecosystem.</p>
          </article>
        </div>
      </section>

      <section className="darkSection" id="tokenomics">
        <div className="contentWidth">
          <p className="sectionLabel">02 / TOKENOMICS</p>

          <h2>
            SIMPLE. TRANSPARENT.
            <span>VERIFIABLE.</span>
          </h2>

          <div className="launchStatus">
            <strong>Token not launched</strong>
            <p>
              Final supply and launch details will be published before the
              official release.
            </p>
          </div>
        </div>
      </section>

      <section className="infoSection" id="roadmap">
        <p className="sectionLabel">03 / ROADMAP</p>

        <h2>
          FROM SYMBOL
          <span>TO ECOSYSTEM.</span>
        </h2>

        <div className="roadmap">
          <article>
            <small>PHASE 01</small>
            <h3>IGNITION</h3>
            <p>Brand, website, social channels and community foundation.</p>
          </article>

          <article>
            <small>PHASE 02</small>
            <h3>LAUNCH</h3>
            <p>Verified token creation and official contract publication.</p>
          </article>

          <article>
            <small>PHASE 03</small>
            <h3>BULL HUB</h3>
            <p>Community tools and Solana ecosystem discovery.</p>
          </article>

          <article>
            <small>PHASE 04</small>
            <h3>EXPANSION</h3>
            <p>Partnerships, public treasury information and new utilities.</p>
          </article>
        </div>
      </section>

      <section className="community" id="community">
        <div>
          <p className="sectionLabel">04 / COMMUNITY</p>
          <h2>JOIN THE HERD.</h2>

          <div className="socialLinks">
            <a href={xUrl} target="_blank" rel="noreferrer">
              X / @BulleCoinOF
            </a>

            <a href={telegramUrl} target="_blank" rel="noreferrer">
              TELEGRAM / OFFICIAL CHANNEL
            </a>
          </div>
        </div>
      </section>

      <footer>
        <strong>BULLE</strong>
        <span>bullecoin.io</span>
        <p>
          Crypto assets involve substantial risk. Nothing on this website is
          financial advice or a promise of profit.
        </p>
      </footer>
    </main>
  );
}