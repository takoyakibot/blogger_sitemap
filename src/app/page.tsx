"use client";

import { useState, FormEvent } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!url.endsWith('sitemap.xml')) {
      setError('Bloggerのサイトマップを指定してください');
      return;
    }

    try {
      const response = await fetch(`/api/generate-sitemap?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'modified_sitemap.xml';
        link.click();
      } else {
        setError('サイトマップの生成に失敗しました');
      }
    } catch (error) {
      setError('エラーが発生しました');
    }
  };

  return (
    <main className={styles.main}>
      <h2>Blogger Sitemap Generator</h2>
      <div className={styles.inputContainer}>
        https://
        <input
          className={styles.input}
          type="text"
          placeholder="blogger"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />.blogspot.com/sitemap.html
        <button
          className={styles.button}
          type="submit"
        >
          実行
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}
