import React from "react";
import styles from "./DesignPreview.module.css";

export default function DesignPreview() {
  return (
    <div className={styles.page}>
      <header className={styles.globalNav}>
        <div className={styles.navInner}>
          <div className={styles.brand}>Boysgadget</div>
          <div className={styles.navActions}>
            <button className={styles.icon}>☰</button>
            <button className={styles.cta}>Sign in</button>
          </div>
        </div>
      </header>

      <section className={styles.tileLight}>
        <div className={styles.container}>
          <h1 className={styles.hero}>Photography-first interface</h1>
          <p className={styles.tagline}>Edge-to-edge product tiles framed by tight typography and a single Action Blue.</p>
          <div className={styles.actions}>
            <button className={styles.primary}>Learn more</button>
            <button className={styles.secondary}>Buy</button>
          </div>
        </div>
      </section>

      <section className={styles.tileDark}>
        <div className={styles.containerWide}>
          <div className={styles.leftColumn}>
            <h2 className={styles.display}>The Gadget 2026</h2>
            <p className={styles.lead}>Crisp imaging, impossibly thin silhouette.</p>
            <div className={styles.actions}>
              <button className={styles.primaryOnDark}>Buy</button>
              <button className={styles.secondaryOnDark}>Learn more</button>
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.product}>
              <div className={styles.device} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.tileParchment}>
        <div className={styles.container}>
          <h3 className={styles.displayMd}>Accessories</h3>
          <div className={styles.grid}>
            <div className={styles.card}>Case</div>
            <div className={styles.card}>Charger</div>
            <div className={styles.card}>Band</div>
            <div className={styles.card}>Earbuds</div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p className={styles.fine}>© 2026 Boysgadget — design preview</p>
        </div>
      </footer>
    </div>
  );
}
