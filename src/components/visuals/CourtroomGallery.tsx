
import styles from './CourtroomGallery.module.css';

// Simple silhouettes representing observers in the courtroom gallery
export default function CourtroomGallery() {
  return (
    <div className={styles.galleryContainer} aria-label="Courtroom gallery observers">
      {/* Rows of observer silhouettes */}
      {[...Array(3)].map((_, row) => (
        <div key={row} className={styles.row}>
          {[...Array(5)].map((_, col) => (
            <div key={col} className={styles.silhouette} />
          ))}
        </div>
      ))}
      {/* Review panel overlay */}
      <div className={styles.reviewPanel}>Review Panel</div>
    </div>
  );
}
