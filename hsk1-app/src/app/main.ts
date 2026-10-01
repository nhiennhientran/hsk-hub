import './styles.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Application root is missing.');

// Step 1 deliberately has no student modules. Step 2 introduces the single router.
root.innerHTML = `
  <article class="checkpoint" aria-labelledby="checkpoint-title">
    <p class="eyebrow">HSK 1 · 重构工程</p>
    <h1 id="checkpoint-title">第 1 步：基线与工程骨架</h1>
    <p>需求、内容来源和验证方法已固定。学生功能将按后续步骤接入。</p>
    <dl>
      <div><dt>技术基础</dt><dd>TypeScript · ESM · Vite · 原生 CSS</dd></div>
      <div><dt>产品基线</dt><dd>15 课教材 · 225 作业 · 75 听力</dd></div>
      <div><dt>验收状态</dt><dd>工程检查页；尚未替换学生网站</dd></div>
    </dl>
  </article>
`;
