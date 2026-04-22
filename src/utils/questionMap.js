import vocabQ from '../data/questions_vocab.json'
import poetryQ from '../data/questions_poetry.json'
import idiomQ from '../data/questions_idiom.json'
import sentenceQ from '../data/questions_sentence.json'
import litQ from '../data/questions_literature.json'
import enVocabQ from '../data/questions_en_vocab.json'
import enListenQ from '../data/questions_en_listen.json'
import enGrammarQ from '../data/questions_en_grammar.json'
import enReadingQ from '../data/questions_en_reading.json'
import enWritingQ from '../data/questions_en_writing.json'
import enClozeQ from '../data/questions_en_j2_cloze.json'
import politicsQ from '../data/questions_politics_choice.json'
import mathBasicQ from '../data/questions_math_basic.json'
import mathGeoQ from '../data/questions_math_geometry.json'
import mathOlympiadQ from '../data/questions_math_olympiad.json'
import mathEqQ from '../data/questions_math_junior_equation.json'
import mathFnQ from '../data/questions_math_junior_function.json'
import mathAlgQ from '../data/questions_math_junior_algebra.json'
import mathJrGeoQ from '../data/questions_math_junior_geo.json'
import jcBasicQ from '../data/questions_junior_chinese_basic.json'
import jcPoetryQ from '../data/questions_junior_chinese_poetry.json'
import jcClassicalQ from '../data/questions_junior_chinese_classical.json'
import jcNovelQ from '../data/questions_junior_chinese_novel.json'
import jcExprQ from '../data/questions_junior_chinese_expression.json'

const POLITICS_ALL = Array.isArray(politicsQ) ? politicsQ : (politicsQ.questions || [])

const ALL = [
  ...vocabQ, ...poetryQ, ...idiomQ, ...sentenceQ, ...litQ,
  ...enVocabQ, ...enListenQ, ...enGrammarQ, ...enReadingQ, ...enWritingQ, ...enClozeQ,
  ...POLITICS_ALL,
  ...mathBasicQ, ...mathGeoQ, ...mathOlympiadQ,
  ...mathEqQ, ...mathFnQ, ...mathAlgQ, ...mathJrGeoQ,
  ...(Array.isArray(jcBasicQ) ? jcBasicQ : []),
  ...(Array.isArray(jcPoetryQ) ? jcPoetryQ : []),
  ...(Array.isArray(jcClassicalQ) ? jcClassicalQ : []),
  ...(Array.isArray(jcNovelQ) ? jcNovelQ : []),
  ...(Array.isArray(jcExprQ) ? jcExprQ : []),
]

export const FULL_Q_MAP = Object.fromEntries(ALL.map(q => [q.id, q]))
