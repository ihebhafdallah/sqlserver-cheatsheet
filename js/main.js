(function () {
    /* ---- texte de recherche (avant d'ajouter les boutons de copie) ---- */
    document.querySelectorAll('.cs-card').forEach(function (c) { c.dataset.s = c.textContent.toLowerCase(); });

    /* ---- coloration syntaxique T-SQL ---- */
    var KW = new Set(('ADD|ALL|ALTER|AND|ANY|AS|ASC|AFTER|APPLY|BACKUP|BEGIN|BETWEEN|BREAK|BY|CASCADE|CASE|CATCH|CHECK|CLOSE|CLUSTERED|COLUMN|COMMIT|CONSTRAINT|CONTINUE|CREATE|CROSS|CUBE|CURRENT|CURSOR|DATABASE|DEALLOCATE|DECLARE|DEFAULT|DELETE|DENY|DESC|DISK|DISTINCT|DROP|ELSE|END|EXCEPT|EXEC|EXECUTE|EXISTS|FAST_FORWARD|FETCH|FIRST|FOLLOWING|FOR|FOREIGN|FROM|FULL|FUNCTION|GO|GRANT|GROUP|GROUPING|HAVING|IDENTITY|IF|IN|INCLUDE|INDEX|INNER|INSERT|INSTEAD|INTERSECT|INTO|IS|JOIN|KEY|LEFT|LIKE|LOGIN|MATCHED|MEMBER|MERGE|NEXT|NOT|NULL|OFFSET|OF|ON|ONLY|OPEN|OPTION|OR|ORDER|OUTER|OUTPUT|OVER|PARTITION|PERCENT|PRECEDING|PRIMARY|PRINT|PROC|PROCEDURE|REFERENCES|RESTORE|RETURN|RETURNS|REVOKE|RIGHT|ROLE|ROLLBACK|ROLLUP|ROW|ROWS|SCHEMA|SELECT|SEQUENCE|SET|SETS|TABLE|TARGET|THEN|THROW|TIES|TO|TOP|TRAN|TRANSACTION|TRIGGER|TRUNCATE|TRY|UNBOUNDED|UNION|UNIQUE|UPDATE|USE|USING|VALUES|VIEW|WHEN|WHERE|WHILE|WITH|WITHIN').split('|'));
    var TY = new Set('INT|BIGINT|SMALLINT|TINYINT|BIT|DECIMAL|NUMERIC|MONEY|FLOAT|REAL|CHAR|VARCHAR|NCHAR|NVARCHAR|TEXT|DATE|TIME|DATETIME|DATETIME2|SMALLDATETIME|DATETIMEOFFSET|UNIQUEIDENTIFIER|VARBINARY|XML|MAX'.split('|'));
    var RE = /(--[^\n]*|\/\*[\s\S]*?\*\/)|(N?'(?:''|[^'])*')|(@@?\w+)|(\[[^\]\n]+\])|(\b\d+(?:\.\d+)?\b)|(#{1,2}\w+)|(\b[A-Za-z_]\w*\b)/g;
    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function hl(src) {
        var out = '', last = 0, m;
        RE.lastIndex = 0;
        while ((m = RE.exec(src))) {
            out += esc(src.slice(last, m.index));
            var t = m[0], cls = '';
            if (m[1]) cls = 'c';
            else if (m[2]) cls = 's';
            else if (m[3] || m[6]) cls = 'v';
            else if (m[4]) cls = 'b';
            else if (m[5]) cls = 'n';
            else {
                var u = t.toUpperCase();
                if (TY.has(u)) cls = 't';
                else if (KW.has(u)) cls = 'k';
                else if (src.charAt(m.index + t.length) === '(') cls = 'f';
            }
            out += cls ? '<span class="' + cls + '">' + esc(t) + '</span>' : esc(t);
            last = m.index + t.length;
        }
        return out + esc(src.slice(last));
    }

    /* ---- blocs de code + bouton Copier ---- */
    function copy(text, btn) {
        function done() {
            var o = btn.textContent; btn.textContent = 'Copié ✓'; btn.classList.add('ok');
            setTimeout(function () { btn.textContent = o; btn.classList.remove('ok'); }, 1400);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallback(); });
        } else { fallback(); }
        function fallback() {
            var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a);
            a.select(); try { document.execCommand('copy'); } catch (e) { } a.remove(); done();
        }
    }
    var pres = document.querySelectorAll('pre');
    pres.forEach(function (pre) {
        var raw = pre.textContent.replace(/^\s*\n/, '').replace(/\s+$/, '');
        var plain = pre.classList.contains('plain');
        var label = pre.dataset.label || (plain ? 'Terminal' : 'T-SQL');
        var code = document.createElement('code');
        code.innerHTML = plain ? esc(raw) : hl(raw);
        pre.textContent = ''; pre.appendChild(code);
        var wrap = document.createElement('div'); wrap.className = 'code';
        pre.parentNode.insertBefore(wrap, pre);
        var bar = document.createElement('div'); bar.className = 'code-bar';
        bar.innerHTML = '<span>' + label + '</span><button type="button" aria-label="Copier le code">Copier</button>';
        wrap.appendChild(bar); wrap.appendChild(pre);
        bar.querySelector('button').addEventListener('click', function (e) { copy(raw, e.currentTarget); });
    });
    var nb = document.getElementById('nbEx');
    if (nb) nb.textContent = pres.length;

    /* ---- schémas de jointures (diagrammes de Venn) ---- */
    document.querySelectorAll('.venn').forEach(function (el, i) {
        var t = el.dataset.v, id = 'vn' + i, F = '#163300', G = '#e8ebe6';
        var A = '<circle cx="42" cy="30" r="26"', B = '<circle cx="72" cy="30" r="26"', hi = '';
        if (t === 'inner') hi = B + ' fill="' + F + '" clip-path="url(#' + id + 'a)"/>';
        if (t === 'left') hi = A + ' fill="' + F + '"/>';
        if (t === 'right') hi = B + ' fill="' + F + '"/>';
        if (t === 'full') hi = A + ' fill="' + F + '"/>' + B + ' fill="' + F + '"/>';
        if (t === 'anti') hi = A + ' fill="' + F + '"/>' + B + ' fill="' + G + '"/>';
        el.innerHTML = '<svg viewBox="0 0 114 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<defs><clipPath id="' + id + 'a">' + A + '/></clipPath></defs>' +
            A + ' fill="' + G + '"/>' + B + ' fill="' + G + '"/>' + hi +
            '<g fill="none" stroke="' + F + '" stroke-width="2">' + A + '/>' + B + '/></g>' +
            '<g font-family="Inter,sans-serif" font-size="9" font-weight="700" text-anchor="middle" fill="' + F + '">' +
            '</g></svg>';
    });

    /* ---- recherche ---- */
    var q = document.getElementById('q'), info = document.getElementById('resultInfo');
    function filter() {
        var v = q.value.trim().toLowerCase(), total = 0;
        document.body.classList.toggle('searching', !!v);
        document.querySelectorAll('.sec').forEach(function (sec) {
            var vis = 0;
            sec.querySelectorAll('.cs-card').forEach(function (c) {
                var col = c.closest('[class*="col-"]') || c;
                var ok = !v || c.dataset.s.indexOf(v) !== -1;
                col.hidden = !ok; if (ok) vis++;
            });
            sec.hidden = !!v && vis === 0; total += vis;
        });
        info.hidden = !v;
        if (v) info.textContent = total ? total + ' résultat' + (total > 1 ? 's' : '') + ' pour « ' + q.value.trim() + ' »' : 'Aucun résultat pour « ' + q.value.trim() + ' ». Essaie un autre mot-clé (ex. JOIN, DATE, INDEX).';
    }
    q.addEventListener('input', filter);
    document.addEventListener('keydown', function (e) {
        if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
        if (e.key === 'Escape' && document.activeElement === q) { q.value = ''; filter(); q.blur(); }
    });

    /* ---- navigation : section active ---- */
    var links = Array.prototype.slice.call(document.querySelectorAll('.pillnav a'));
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.dataset.group === e.target.dataset.group); });
        });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('.sec[data-group]').forEach(function (s) { io.observe(s); });
    links.forEach(function (a) {
        a.addEventListener('click', function () {
            var c = document.getElementById('nav');
            if (c.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(c).hide();
        });
    });

    /* ---- retour en haut ---- */
    var top = document.getElementById('totop');
    window.addEventListener('scroll', function () { top.classList.toggle('show', window.scrollY > 600); }, { passive: true });
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();