import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateArtManifest } from './audit-course-art-manifest.mjs';

function fixture(testFn) {
  const root = mkdtempSync(join(tmpdir(), 'skilled-art-manifest-'));
  try {
    mkdirSync(join(root, 'brand/carpentry'),{recursive:true});
    mkdirSync(join(root, 'library'),{recursive:true});
    writeFileSync(join(root, 'brand/carpentry/icon.png'),'valid icon bytes');
    testFn(root);
  } finally { rmSync(root,{recursive:true,force:true}); }
}
const entry = path => ({icon: path, iconSvg:null, logo:null, thumb:null, banner:null, topics:{},hero:[]});

test('all canonical course-art URLs resolve to tracked source files', () => {
  const report = validateArtManifest();
  assert.equal(report.passed, true, JSON.stringify(report.issues.slice(0,15)));
  assert.deepEqual(report.issues, []);
  assert.equal(report.courses, 43);
  assert.equal(report.referencedAssets, 491);
});

test('a safe URL resolves under brand and is allowed with null optional artwork', () => fixture(root => {
  const result = validateArtManifest({sourceRoot:root, manifest:{carpentry:entry('/academy/brand/carpentry/icon.png')}});
  assert.equal(result.passed,true);
  assert.equal(result.referencedAssets,1);
}));

test('a removed source asset is detected without writing a generated copy', () => fixture(root => {
  const report=validateArtManifest({sourceRoot:root,manifest:{carpentry:entry('/academy/brand/carpentry/deleted.png')}});
  assert.equal(report.passed,false);
  assert.ok(report.issues.some(x=>x.kind==='missing-file'));
}));

test('absolute, remote and traversal URLs never escape repository sections', () => fixture(root => {
  const manifest={
    remote:entry('https://external.test/asset.png'),
    wrongPrefix:entry('/uploads/brand/a.png'),
    traversal:entry('/academy/brand/../../private/secret.png'),
    empty:entry(''),
  };
  const report=validateArtManifest({sourceRoot:root,manifest});
  assert.equal(report.passed,false);
  assert.equal(report.issues.length,4);
  assert.ok(report.issues.every(x=>['unsafe-url','path-traversal'].includes(x.kind)));
}));

test('symbolic linked files cannot expose noncanonical content', () => fixture(root => {
  symlinkSync(join(root,'brand/carpentry/icon.png'),join(root,'brand/carpentry/alias.png'));
  const report=validateArtManifest({sourceRoot:root,manifest:{carpentry:entry('/academy/brand/carpentry/alias.png')}});
  assert.equal(report.passed,false);
  assert.ok(report.issues.some(x=>x.kind==='not-regular-file'));
}));

test('nested topic and hero images are validated like course thumbnails', () => fixture(root => {
  const e=entry('/academy/brand/carpentry/icon.png');
  e.topics={danger:'/academy/brand/carpentry/missing-topic.png'};
  e.hero=['/academy/library/missing-hero.png'];
  const report=validateArtManifest({sourceRoot:root,manifest:{carpentry:e}});
  assert.equal(report.referencedAssets,3);
  assert.deepEqual(report.issues.map(x=>x.kind),['missing-file','missing-file']);
}));
