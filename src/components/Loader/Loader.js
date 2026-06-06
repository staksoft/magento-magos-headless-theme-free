import React from 'react';
import styles from './Loader.module.css';

export default function Loader({ fullscreen = false, text = 'Aetheris' }) {
  return (
    <div className={`${styles.loaderContainer} ${fullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.spinner}></div>
      <div className={styles.text}>{text}</div>
    </div>
  );
}
