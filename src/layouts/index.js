import styles from './index.css';
import 'antd/dist/antd.css';

function BasicLayout(props) {
  return (
    <div className={styles.normal}>
      {/* <h1 className={styles.title}>Yay! Welcome to umi!</h1> */}
      {props.children}
    </div>
  );
}

export default BasicLayout;
