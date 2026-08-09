import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { InlineMarkdownText } from './ProseContent'

const mono = "'IBM Plex Mono', 'IBM Plex Sans', system-ui, monospace"

interface ChoiceProps {
  children?: ReactNode
  correct?: boolean
}
/** A single answer choice; mark the right one with `correct`. */
export function Choice(_props: ChoiceProps) {
  return null
}
Choice.displayName = 'Choice'

interface QProps {
  children?: ReactNode
}
/** A single quiz question wrapping its <Prompt>, <Explain> and <Choice> children. */
export function Q({ children }: QProps) {
  return null
}
Q.displayName = 'Q'

interface PromptProps {
  children?: ReactNode
}
/** Marker: wraps the question prompt rendered via MDX. */
export function Prompt({ children }: PromptProps) {
  return null
}
Prompt.displayName = 'Prompt'

interface ExplainProps {
  children?: ReactNode
}
/** Marker: wraps the feedback explanation rendered via MDX. */
export function Explain({ children }: ExplainProps) {
  return null
}
Explain.displayName = 'Explain'

interface ParsedQuestion {
  prompt: ReactNode
  explain?: ReactNode
  choices: { text: ReactNode; correct: boolean }[]
  correctIndex: number
}

function isTypeOf(type: unknown, name: string): boolean {
  if (typeof type === 'function' && 'displayName' in type) {
    return (type as { displayName: string }).displayName === name
  }
  return false
}

function parseQuestions(children: ReactNode): ParsedQuestion[] {
  return Children.toArray(children)
    .filter((c): c is ReactElement => isValidElement(c))
    .map((qEl) => {
      let prompt: ReactNode | undefined
      let explain: ReactNode | undefined
      const choices: { text: ReactNode; correct: boolean }[] = []

      Children.toArray(qEl.props.children).forEach((child) => {
        if (!isValidElement(child)) return
        const t = child.type
        if (isTypeOf(t, 'Prompt')) prompt = child.props.children
        else if (isTypeOf(t, 'Explain')) explain = child.props.children
        else if (isTypeOf(t, 'Choice')) choices.push({ text: child.props.children, correct: !!child.props.correct })
      })

      return {
        prompt: prompt ?? '',
        explain,
        choices,
        correctIndex: choices.findIndex((c) => c.correct),
      }
    })
}

interface QuizProps {
  children?: ReactNode
}

/**
 * An interactive multiple-choice knowledge check. Authors write declarative
 * markup — no logic — and the component handles scoring and per-question feedback:
 *
 * <Quiz>
 *   <Q>
 *     <Prompt>…?</Prompt>
 *     <Explain>…</Explain>
 *     <Choice>Wrong</Choice>
 *     <Choice correct>Right</Choice>
 *   </Q>
 * </Quiz>
 */
export function Quiz({ children }: QuizProps) {
  const { t } = useI18n()
  const questions = useMemo(() => parseQuestions(children), [children])
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const answeredCount = Object.keys(answers).length
  const correctCount = questions.reduce(
    (n, q, i) => (answers[i] === q.correctIndex ? n + 1 : n),
    0,
  )
  const scoreLabel =
    answeredCount === 0 ? t.quizNotStarted : t.quizScore(correctCount, questions.length)

  return (
    <div className="quiz-markdown">
      <p style={{ fontSize: 13, color: 'var(--tx-3)', fontFamily: mono, margin: '0 0 16px' }}>
        {scoreLabel}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {questions.map((q, qi) => {
          const chosen = answers[qi]
          const answered = chosen != null
          const isCorrect = chosen === q.correctIndex
          return (
            <div
              key={qi}
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', gap: 11, marginBottom: 14 }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: 'var(--ac1)', flex: 'none', paddingTop: 2 }}>
                  Q{qi + 1}
                </span>
                <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--tx-strong)', fontWeight: 500 }}>
                  {renderMarkdown(q.prompt)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.choices.map((choice, ci) => {
                  let bg = 'var(--bg-inset)'
                  let bd = 'var(--line)'
                  let col = 'var(--tx-1)'
                  let mark = ''
                  if (answered) {
                    if (ci === q.correctIndex) {
                      bg = 'rgba(var(--ac4-rgb),0.1)'
                      bd = 'rgba(var(--ac4-rgb),0.5)'
                      col = 'var(--ac4)'
                      mark = '✓'
                    } else if (ci === chosen) {
                      bg = 'rgba(var(--ac5-rgb),0.1)'
                      bd = 'rgba(var(--ac5-rgb),0.5)'
                      col = 'var(--ac5)'
                      mark = '✗'
                    } else {
                      col = 'var(--tx-6)'
                      bd = 'rgba(var(--ac1-rgb),0.0)'
                    }
                  }
                  return (
                    <button
                      key={ci}
                      type="button"
                      disabled={answered}
                      onClick={() => !answered && setAnswers((a) => ({ ...a, [qi]: ci }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 14px',
                        borderRadius: 9,
                        cursor: answered ? 'default' : 'pointer',
                        fontSize: 13.5,
                        lineHeight: 1.4,
                        transition: 'all .15s',
                        background: bg,
                        border: `1px solid ${bd}`,
                        color: col,
                      }}
                    >
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        {renderMarkdown(choice.text)}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 14 }}>{mark}</span>
                    </button>
                  )
                })}
              </div>
              {answered && (
                <div
                  style={{
                    marginTop: 13,
                    padding: '11px 14px',
                    borderRadius: 9,
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    background: isCorrect ? 'rgba(var(--ac4-rgb),0.07)' : 'rgba(var(--ac2-rgb),0.07)',
                    borderLeft: `2px solid ${isCorrect ? 'var(--ac4)' : 'var(--ac2)'}`,
                    color: 'var(--tx-2)',
                  }}
                >
                  {isCorrect
                    ? t.quizCorrect
                    : t.quizNotQuite(String(reactToText(q.choices[q.correctIndex]?.text)))}
                  {renderMarkdown(q.explain)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Render ReactNode → InlineMarkdownText if string, else pass through. */
function renderMarkdown(node: ReactNode) {
  if (node == null) return null
  if (typeof node === 'string' || typeof node === 'number') {
    return <InlineMarkdownText content={String(node)} />
  }
  return node
}

/** Best-effort flatten of a choice's React children to plain text for messages. */
function reactToText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(reactToText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return reactToText(node.props.children)
  return ''
}
