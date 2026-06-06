import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brandCol}>
          <div className={styles.logo}>
            Aetheris<span>.</span>
          </div>
          <p className={styles.brandDesc}>
            Curating premium designer clothing and luxury accessories. Engineered on Mage-OS headless architecture.
          </p>
        </div>

        <div className={styles.col}>
          <h3 className={styles.title}>Collections</h3>
          <ul className={styles.list}>
            <li><Link href="/category/women" className={styles.link}>Women's Ready-To-Wear</Link></li>
            <li><Link href="/category/men" className={styles.link}>Men's Tailoring</Link></li>
            <li><Link href="/category/gear" className={styles.link}>Designer Gear</Link></li>
            <li><Link href="/category/what-is-new" className={styles.link}>Seasonal Newness</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3 className={styles.title}>Services</h3>
          <ul className={styles.list}>
            <li><a href="#" className={styles.link}>Private Styling</a></li>
            <li><a href="#" className={styles.link}>Bespoke Alterations</a></li>
            <li><a href="#" className={styles.link}>Complimentary Delivery</a></li>
            <li><a href="#" className={styles.link}>Care Guide</a></li>
          </ul>
        </div>

        <div className={styles.col}>
          <h3 className={styles.title}>Corporate</h3>
          <ul className={styles.list}>
            <li><a href="#" className={styles.link}>Atelier Story</a></li>
            <li><a href="#" className={styles.link}>Sustainability Pledge</a></li>
            <li><a href="#" className={styles.link}>Careers</a></li>
            <li><a href="#" className={styles.link}>Press Inquiries</a></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} AETHERIS ATELIER. ALL RIGHTS RESERVED.
        </div>
        <div className={styles.credit}>
          POWERED BY <span>MAGE-OS</span> HEADLESS
        </div>
      </div>
    </footer>
  );
}
