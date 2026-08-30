#!/usr/bin/env node
// 兑换码批量生成器
// 用法：node scripts/generate-redeem-codes.js --type pioneer --count 10 --output scripts/pioneer-codes.csv

const fs = require('fs');
const path = require('path');

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 排除 0, O, I, l

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    type: 'pioneer',
    count: 10,
    output: '',
    format: 'csv'
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    switch (key) {
      case '--type':
        result.type = String(value || 'pioneer').toLowerCase();
        break;
      case '--count':
        result.count = Math.max(1, parseInt(value || '10', 10));
        break;
      case '--output':
        result.output = String(value || '');
        break;
      case '--format':
        result.format = String(value || 'csv').toLowerCase();
        break;
    }
  }

  if (!result.output) {
    result.output = path.join(__dirname, `${result.type}-codes.${result.format === 'csv' ? 'csv' : 'txt'}`);
  }

  return result;
}

function randomSegment(length) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function generateOne(type) {
  const t = String(type || 'gift').toUpperCase();
  return `${t}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
}

function buildRewardJson(type) {
  switch (type) {
    case 'pioneer':
      return {
        coins: 300,
        inspiration: 30,
        seeds: { starlight_fern: 2 },
        items: {
          brush_reed_pen: 2,
          brush_swan_quill: 2,
          brush_mithril_nib: 1,
          repair_scroll: 2,
          favor_note_targeted: 2,
          favor_note_random: 1
        },
        signboards: ['pioneer_ink']
      };
    case 'opening':
      return {
        signboards: ['opening_plaque']
      };
    case 'gift':
    default:
      return {
        coins: 100,
        inspiration: 10
      };
  }
}

function main() {
  const { type, count, output, format } = parseArgs();

  if (!['pioneer', 'opening', 'gift'].includes(type)) {
    console.error(`Unsupported type: ${type}. Use pioneer|opening|gift.`);
    process.exit(1);
  }

  const codes = new Set();
  let safety = 0;
  while (codes.size < count && safety < count * 100) {
    codes.add(generateOne(type));
    safety++;
  }

  if (codes.size < count) {
    console.error('Failed to generate enough unique codes.');
    process.exit(1);
  }

  const list = Array.from(codes);
  const absOutput = path.resolve(output);
  const sqlOutput = absOutput.replace(/\.(csv|txt)$/i, '') + '-insert.sql';

  // 写 CSV/TXT 文件
  if (format === 'csv') {
    fs.writeFileSync(absOutput, 'code,type\n' + list.map(c => `${c},${type}`).join('\n') + '\n');
  } else {
    fs.writeFileSync(absOutput, list.join('\n') + '\n');
  }

  // 生成 SQL INSERT 片段
  const rewardJson = JSON.stringify(buildRewardJson(type));
  const maxUses = type === 'opening' ? 100 : 1;
  const expiresAt = type === 'gift' ? "now() + interval '90 days'" : 'NULL';

  const sqlValues = list
    .map(code => `('${code}', '${rewardJson}'::jsonb, ${maxUses}, '${type}', 'manual_batch_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}')`)
    .join(',\n  ');

  const sql = `-- 自动生成的 ${type.toUpperCase()} 兑换码插入脚本\n` +
    `-- 生成时间：${new Date().toISOString()}\n` +
    `INSERT INTO public.redeem_codes (code, reward_json, max_uses, code_type, created_by) VALUES\n  ${sqlValues};`;

  fs.writeFileSync(sqlOutput, sql);

  console.log(`✅ Generated ${list.length} ${type.toUpperCase()} codes -> ${absOutput}`);
  console.log(`✅ SQL insert script -> ${sqlOutput}`);
  console.log('\n-- SQL insert snippet --');
  console.log(sql);
}

main();
