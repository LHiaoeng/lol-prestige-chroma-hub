(() => {
  const attachFallback = (root = document) => root.querySelectorAll('img[data-fallback]').forEach((img) => {
    if (img.dataset.bound) return;
    img.dataset.bound = '1';
    img.addEventListener('error', () => {
      if (img.src !== img.dataset.fallback) { img.src = img.dataset.fallback; return; }
      if (img.src !== img.dataset.placeholder) img.src = img.dataset.placeholder;
    });
  });
  attachFallback();
  const form = document.querySelector('[data-filters]');
  const list = document.querySelector('[data-chroma-list]');
  if (!form || !list) return;
  const status = document.querySelector('[data-status]');
  const count = document.querySelector('[data-result-count]');
  const pagination = document.querySelector('[data-pagination]');
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const card = (item) => `<article class="chroma-card"><a href="/chromas/${encodeURIComponent(item.slug)}/"><div class="card-image"><img src="https://img.chromaart.lol/${esc(item.imageMedium)}" data-fallback="https://game.gtimg.cn/images/lol/act/a20230715chromahub/skin/site5-${encodeURIComponent(item.instanceId)}.jpg" data-placeholder="/placeholder.svg" alt="${esc(item.heroNameZh)} ${esc(item.nameZh)} 臻彩皮肤" width="960" height="540" loading="lazy">${item.isNew?'<span class="new-badge">NEW</span>':''}</div><div class="card-body"><p class="eyebrow">${esc(item.heroNameZh)} · ${esc(item.gameVer)}</p><h2>${esc(item.nameZh)}</h2><p>${esc(item.nameEn)}</p><span class="category">${esc(item.categoryName)}</span></div></a></article>`;
  const load = async (params, push = true) => {
    status.hidden = false; status.className = 'status'; status.textContent = '正在载入臻彩…'; list.setAttribute('aria-busy','true');
    try {
      const response = await fetch(`/api/chromas?${params}`);
      if (!response.ok) throw new Error('request failed');
      const data = await response.json();
      list.innerHTML = data.items.map(card).join('');
      status.hidden = data.items.length > 0;
      status.textContent = data.items.length ? '' : '没有符合条件的臻彩。请清除筛选后重试。';
      count.textContent = `${data.pagination.total} 件藏品`;
      pagination.innerHTML = Array.from({length:data.pagination.pages},(_,i)=>i+1).slice(Math.max(0,data.pagination.page-3),data.pagination.page+2).map((page)=>`<button type="button" data-page="${page}" ${page===data.pagination.page?'aria-current="page"':''}>${page}</button>`).join('');
      attachFallback(list);
      if (push) history.pushState({},'',params.toString()?`/?${params}`:'/');
    } catch { status.hidden=false; status.className='status error'; status.textContent='加载失败，请稍后重试。'; }
    finally { list.removeAttribute('aria-busy'); }
  };
  const restore = () => { const p=new URLSearchParams(location.search); for(const el of form.elements) if(el.name) el.value=p.get(el.name)||''; return p; };
  form.addEventListener('submit',(event)=>{event.preventDefault();const p=new URLSearchParams(new FormData(form));for(const [k,v] of [...p])if(!v)p.delete(k);p.delete('page');load(p);});
  form.addEventListener('reset',()=>setTimeout(()=>load(new URLSearchParams()),0));
  pagination.addEventListener('click',(event)=>{const button=event.target.closest('[data-page]');if(!button)return;const p=new URLSearchParams(location.search);p.set('page',button.dataset.page);load(p);});
  addEventListener('popstate',()=>load(restore(),false));
  const initial=restore(); if(initial.toString()) load(initial,false);
})();
