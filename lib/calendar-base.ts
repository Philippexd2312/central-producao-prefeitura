import { CalendarEventType } from '@prisma/client';
import { db } from '@/lib/db';

type FixedEvent = {
  title: string;
  mmdd: string;
  type?: CalendarEventType;
  description?: string;
};

type DatedEvent = {
  title: string;
  date: Date;
  type: CalendarEventType;
  description: string;
};

const C = CalendarEventType.COMMEMORATIVE;
const I = CalendarEventType.INSTITUTIONAL;
const P = CalendarEventType.CAMPAIGN;

// Calendário editorial amplo para comunicação pública municipal.
// Prioriza datas nacionais, internacionais, saúde, educação, cultura,
// meio ambiente, cidadania, profissões e serviços públicos.
export const FIXED_CALENDAR_EVENTS: FixedEvent[] = [
  { title: 'Confraternização Universal', mmdd: '01-01', type: I },
  { title: 'Dia Mundial da Paz', mmdd: '01-01', type: I },
  { title: 'Dia Nacional da Abreugrafia', mmdd: '01-04' },
  { title: 'Dia Mundial do Braille', mmdd: '01-04' },
  { title: 'Dia do Leitor', mmdd: '01-07' },
  { title: 'Dia do Fotógrafo', mmdd: '01-08' },
  { title: 'Dia do Empresário Contábil', mmdd: '01-12' },
  { title: 'Dia Mundial do Compositor', mmdd: '01-15' },
  { title: 'Dia do Farmacêutico', mmdd: '01-20' },
  { title: 'Dia Nacional de Combate à Intolerância Religiosa', mmdd: '01-21', type: P },
  { title: 'Dia Mundial da Educação', mmdd: '01-24', type: P },
  { title: 'Dia da Previdência Social', mmdd: '01-24' },
  { title: 'Dia Nacional dos Aposentados', mmdd: '01-24' },
  { title: 'Dia do Carteiro', mmdd: '01-25' },
  { title: 'Dia Nacional de Combate ao Trabalho Escravo', mmdd: '01-28', type: P },
  { title: 'Dia Nacional da Visibilidade Trans', mmdd: '01-29', type: P },
  { title: 'Dia da Saudade', mmdd: '01-30' },

  { title: 'Dia do Publicitário', mmdd: '02-01' },
  { title: 'Dia Mundial de Combate ao Câncer', mmdd: '02-04', type: P },
  { title: 'Dia Nacional da Mamografia', mmdd: '02-05', type: P },
  { title: 'Dia do Agente de Defesa Ambiental', mmdd: '02-06' },
  { title: 'Dia Nacional de Luta dos Povos Indígenas', mmdd: '02-07', type: P },
  { title: 'Dia da Internet Segura', mmdd: '02-07', type: P },
  { title: 'Dia do Atleta Profissional', mmdd: '02-10' },
  { title: 'Dia Internacional das Mulheres e Meninas na Ciência', mmdd: '02-11', type: P },
  { title: 'Dia Mundial do Rádio', mmdd: '02-13' },
  { title: 'Dia Internacional de Luta contra o Câncer Infantil', mmdd: '02-15', type: P },
  { title: 'Dia do Repórter', mmdd: '02-16' },
  { title: 'Dia Mundial da Justiça Social', mmdd: '02-20', type: P },
  { title: 'Dia Internacional da Língua Materna', mmdd: '02-21', type: P },
  { title: 'Dia Mundial das Doenças Raras', mmdd: '02-28', type: P },

  { title: 'Dia Mundial da Zero Discriminação', mmdd: '03-01', type: P },
  { title: 'Dia Mundial da Vida Selvagem', mmdd: '03-03', type: P },
  { title: 'Dia Nacional da Música Clássica', mmdd: '03-05' },
  { title: 'Dia Internacional da Mulher', mmdd: '03-08', type: P },
  { title: 'Dia Mundial do Rim', mmdd: '03-09', type: P },
  { title: 'Dia do Bibliotecário', mmdd: '03-12' },
  { title: 'Dia Nacional dos Animais', mmdd: '03-14' },
  { title: 'Dia do Consumidor', mmdd: '03-15', type: P },
  { title: 'Dia da Escola', mmdd: '03-15', type: P },
  { title: 'Dia Mundial do Sono', mmdd: '03-17', type: P },
  { title: 'Dia Internacional da Felicidade', mmdd: '03-20' },
  { title: 'Dia Mundial da Saúde Bucal', mmdd: '03-20', type: P },
  { title: 'Dia Internacional das Florestas', mmdd: '03-21', type: P },
  { title: 'Dia Internacional contra a Discriminação Racial', mmdd: '03-21', type: P },
  { title: 'Dia Mundial da Síndrome de Down', mmdd: '03-21', type: P },
  { title: 'Dia Mundial da Água', mmdd: '03-22', type: P },
  { title: 'Dia Mundial da Meteorologia', mmdd: '03-23' },
  { title: 'Dia Nacional do Oficial de Justiça', mmdd: '03-25' },
  { title: 'Dia Mundial de Conscientização sobre a Epilepsia', mmdd: '03-26', type: P },
  { title: 'Dia Mundial do Teatro', mmdd: '03-27' },
  { title: 'Dia Mundial da Juventude', mmdd: '03-30', type: P },
  { title: 'Dia da Saúde e Nutrição', mmdd: '03-31', type: P },

  { title: 'Dia da Mentira', mmdd: '04-01' },
  { title: 'Dia Mundial de Conscientização do Autismo', mmdd: '04-02', type: P },
  { title: 'Dia Internacional do Livro Infantil', mmdd: '04-02', type: P },
  { title: 'Dia Nacional do Parkinsoniano', mmdd: '04-04', type: P },
  { title: 'Dia Mundial da Atividade Física', mmdd: '04-06', type: P },
  { title: 'Dia Mundial da Saúde', mmdd: '04-07', type: P },
  { title: 'Dia Mundial de Combate ao Câncer', mmdd: '04-08', type: P },
  { title: 'Dia Nacional da Biblioteca', mmdd: '04-09' },
  { title: 'Dia da Engenharia', mmdd: '04-10' },
  { title: 'Dia Mundial de Conscientização da Doença de Parkinson', mmdd: '04-11', type: P },
  { title: 'Dia Nacional de Combate ao Bullying e à Violência na Escola', mmdd: '04-07', type: P },
  { title: 'Dia dos Povos Indígenas', mmdd: '04-19', type: P },
  { title: 'Dia do Exército Brasileiro', mmdd: '04-19', type: I },
  { title: 'Tiradentes', mmdd: '04-21', type: I },
  { title: 'Dia Mundial da Criatividade e Inovação', mmdd: '04-21' },
  { title: 'Dia da Terra', mmdd: '04-22', type: P },
  { title: 'Dia Mundial do Livro e do Direito de Autor', mmdd: '04-23', type: P },
  { title: 'Dia Nacional da Língua Brasileira de Sinais', mmdd: '04-24', type: P },
  { title: 'Dia Mundial de Combate à Meningite', mmdd: '04-24', type: P },
  { title: 'Dia da Contabilidade', mmdd: '04-25' },
  { title: 'Dia Nacional de Prevenção e Combate à Hipertensão Arterial', mmdd: '04-26', type: P },
  { title: 'Dia Mundial da Segurança e Saúde no Trabalho', mmdd: '04-28', type: P },
  { title: 'Dia da Educação', mmdd: '04-28', type: P },
  { title: 'Dia Internacional da Dança', mmdd: '04-29' },

  { title: 'Dia do Trabalho', mmdd: '05-01', type: I },
  { title: 'Dia Mundial da Liberdade de Imprensa', mmdd: '05-03', type: P },
  { title: 'Dia Nacional das Comunicações', mmdd: '05-05', type: I },
  { title: 'Dia Mundial de Higienização das Mãos', mmdd: '05-05', type: P },
  { title: 'Dia Nacional de Combate ao Glaucoma', mmdd: '05-06', type: P },
  { title: 'Dia Internacional da Cruz Vermelha', mmdd: '05-08' },
  { title: 'Dia Mundial do Lúpus', mmdd: '05-10', type: P },
  { title: 'Dia Internacional da Enfermagem', mmdd: '05-12' },
  { title: 'Dia do Assistente Social', mmdd: '05-15' },
  { title: 'Dia Internacional da Família', mmdd: '05-15', type: P },
  { title: 'Dia Mundial da Reciclagem', mmdd: '05-17', type: P },
  { title: 'Dia Internacional contra a LGBTfobia', mmdd: '05-17', type: P },
  { title: 'Dia Nacional de Combate ao Abuso e à Exploração Sexual de Crianças e Adolescentes', mmdd: '05-18', type: P },
  { title: 'Dia Nacional da Luta Antimanicomial', mmdd: '05-18', type: P },
  { title: 'Dia do Pedagogo', mmdd: '05-20' },
  { title: 'Dia Mundial da Diversidade Cultural', mmdd: '05-21', type: P },
  { title: 'Dia Internacional da Biodiversidade', mmdd: '05-22', type: P },
  { title: 'Dia Nacional da Adoção', mmdd: '05-25', type: P },
  { title: 'Dia Nacional de Combate à Mortalidade Materna', mmdd: '05-28', type: P },
  { title: 'Dia Mundial sem Tabaco', mmdd: '05-31', type: P },

  { title: 'Dia da Imprensa', mmdd: '06-01' },
  { title: 'Dia Mundial do Meio Ambiente', mmdd: '06-05', type: P },
  { title: 'Dia Nacional da Reciclagem', mmdd: '06-05', type: P },
  { title: 'Dia Mundial dos Oceanos', mmdd: '06-08', type: P },
  { title: 'Dia Nacional da Imunização', mmdd: '06-09', type: P },
  { title: 'Dia Mundial de Combate ao Trabalho Infantil', mmdd: '06-12', type: P },
  { title: 'Dia dos Namorados', mmdd: '06-12' },
  { title: 'Dia Mundial do Doador de Sangue', mmdd: '06-14', type: P },
  { title: 'Dia Mundial de Conscientização da Violência contra a Pessoa Idosa', mmdd: '06-15', type: P },
  { title: 'Dia do Funcionário Público Aposentado', mmdd: '06-17' },
  { title: 'Dia do Orgulho Autista', mmdd: '06-18', type: P },
  { title: 'Dia do Cinema Brasileiro', mmdd: '06-19' },
  { title: 'Dia Mundial do Refugiado', mmdd: '06-20', type: P },
  { title: 'Dia Nacional de Controle da Asma', mmdd: '06-21', type: P },
  { title: 'Dia do Atleta Olímpico', mmdd: '06-23' },
  { title: 'Dia de São João', mmdd: '06-24' },
  { title: 'Dia Internacional de Combate às Drogas', mmdd: '06-26', type: P },
  { title: 'Dia Internacional do Orgulho LGBTQIA+', mmdd: '06-28', type: P },
  { title: 'Dia do Pescador', mmdd: '06-29' },

  { title: 'Dia Nacional de Combate à Discriminação Racial', mmdd: '07-03', type: P },
  { title: 'Dia Mundial das Zoonoses', mmdd: '07-06', type: P },
  { title: 'Dia Nacional da Ciência e do Pesquisador Científico', mmdd: '07-08' },
  { title: 'Dia Mundial da População', mmdd: '07-11', type: P },
  { title: 'Dia do Engenheiro Florestal', mmdd: '07-12' },
  { title: 'Dia Nacional do Homem', mmdd: '07-15', type: P },
  { title: 'Dia de Proteção às Florestas', mmdd: '07-17', type: P },
  { title: 'Dia Internacional de Nelson Mandela', mmdd: '07-18', type: P },
  { title: 'Dia da Amizade', mmdd: '07-20' },
  { title: 'Dia do Trabalhador Doméstico', mmdd: '07-22' },
  { title: 'Dia Internacional da Mulher Negra Latino-Americana e Caribenha', mmdd: '07-25', type: P },
  { title: 'Dia Nacional de Tereza de Benguela e da Mulher Negra', mmdd: '07-25', type: P },
  { title: 'Dia dos Avós', mmdd: '07-26' },
  { title: 'Dia do Agricultor', mmdd: '07-28' },
  { title: 'Dia Mundial de Luta contra as Hepatites Virais', mmdd: '07-28', type: P },
  { title: 'Dia Internacional da Amizade', mmdd: '07-30' },

  { title: 'Semana Mundial do Aleitamento Materno', mmdd: '08-01', type: P },
  { title: 'Dia Mundial da Amamentação', mmdd: '08-01', type: P },
  { title: 'Dia Nacional da Saúde', mmdd: '08-05', type: P },
  { title: 'Dia Nacional dos Profissionais da Educação', mmdd: '08-06' },
  { title: 'Dia Internacional dos Povos Indígenas', mmdd: '08-09', type: P },
  { title: 'Dia Internacional da Juventude', mmdd: '08-12', type: P },
  { title: 'Dia do Estudante', mmdd: '08-11', type: P },
  { title: 'Dia do Economista', mmdd: '08-13' },
  { title: 'Dia do Cardiologista', mmdd: '08-14' },
  { title: 'Dia da Informática', mmdd: '08-15' },
  { title: 'Dia do Patrimônio Histórico', mmdd: '08-17', type: P },
  { title: 'Dia Nacional do Campo Limpo', mmdd: '08-18', type: P },
  { title: 'Dia Mundial Humanitário', mmdd: '08-19', type: P },
  { title: 'Dia do Folclore', mmdd: '08-22', type: P },
  { title: 'Dia da Infância', mmdd: '08-24', type: P },
  { title: 'Dia Nacional da Educação Infantil', mmdd: '08-25', type: P },
  { title: 'Dia do Psicólogo', mmdd: '08-27' },
  { title: 'Dia Nacional de Combate ao Fumo', mmdd: '08-29', type: P },
  { title: 'Dia do Nutricionista', mmdd: '08-31' },

  { title: 'Dia do Profissional de Educação Física', mmdd: '09-01' },
  { title: 'Dia da Amazônia', mmdd: '09-05', type: P },
  { title: 'Independência do Brasil', mmdd: '09-07', type: I },
  { title: 'Dia Mundial da Alfabetização', mmdd: '09-08', type: P },
  { title: 'Dia do Médico Veterinário', mmdd: '09-09' },
  { title: 'Dia Mundial de Prevenção ao Suicídio', mmdd: '09-10', type: P },
  { title: 'Dia Nacional do Cerrado', mmdd: '09-11', type: P },
  { title: 'Dia do Agrônomo', mmdd: '09-13' },
  { title: 'Dia Mundial da Segurança do Paciente', mmdd: '09-17', type: P },
  { title: 'Dia Nacional de Luta da Pessoa com Deficiência', mmdd: '09-21', type: P },
  { title: 'Dia da Árvore', mmdd: '09-21', type: P },
  { title: 'Dia Mundial da Doença de Alzheimer', mmdd: '09-21', type: P },
  { title: 'Dia Mundial sem Carro', mmdd: '09-22', type: P },
  { title: 'Dia Nacional do Agente de Trânsito', mmdd: '09-23' },
  { title: 'Dia Nacional do Trânsito', mmdd: '09-25', type: P },
  { title: 'Dia Nacional do Surdo', mmdd: '09-26', type: P },
  { title: 'Dia Mundial do Turismo', mmdd: '09-27', type: P },
  { title: 'Dia Mundial do Coração', mmdd: '09-29', type: P },
  { title: 'Dia da Secretária', mmdd: '09-30' },

  { title: 'Dia Internacional da Pessoa Idosa', mmdd: '10-01', type: P },
  { title: 'Dia Nacional do Vereador', mmdd: '10-01', type: I },
  { title: 'Dia Mundial do Habitat', mmdd: '10-02', type: P },
  { title: 'Dia Mundial dos Animais', mmdd: '10-04' },
  { title: 'Dia Nacional dos Agentes Comunitários de Saúde e de Combate às Endemias', mmdd: '10-04' },
  { title: 'Dia Mundial dos Professores', mmdd: '10-05' },
  { title: 'Dia Mundial da Saúde Mental', mmdd: '10-10', type: P },
  { title: 'Dia Nacional de Prevenção da Obesidade', mmdd: '10-11', type: P },
  { title: 'Dia das Crianças', mmdd: '10-12', type: P },
  { title: 'Dia Nacional da Leitura', mmdd: '10-12', type: P },
  { title: 'Dia Nacional do Fisioterapeuta e Terapeuta Ocupacional', mmdd: '10-13' },
  { title: 'Dia do Professor', mmdd: '10-15', type: P },
  { title: 'Dia Mundial da Alimentação', mmdd: '10-16', type: P },
  { title: 'Dia Nacional da Vacinação', mmdd: '10-17', type: P },
  { title: 'Dia do Pintor', mmdd: '10-18' },
  { title: 'Dia do Médico', mmdd: '10-18' },
  { title: 'Dia Mundial de Combate ao Câncer de Mama', mmdd: '10-19', type: P },
  { title: 'Dia do Arquivista', mmdd: '10-20' },
  { title: 'Dia do Servidor Público', mmdd: '10-28', type: I },
  { title: 'Dia Mundial da Psoríase', mmdd: '10-29', type: P },
  { title: 'Dia da Merendeira Escolar', mmdd: '10-30' },

  { title: 'Dia Mundial do Veganismo', mmdd: '11-01' },
  { title: 'Dia Nacional da Língua Portuguesa', mmdd: '11-05', type: P },
  { title: 'Dia do Radiologista', mmdd: '11-08' },
  { title: 'Dia Mundial da Ciência pela Paz e pelo Desenvolvimento', mmdd: '11-10', type: P },
  { title: 'Dia do Diretor Escolar', mmdd: '11-12' },
  { title: 'Dia Mundial do Diabetes', mmdd: '11-14', type: P },
  { title: 'Proclamação da República', mmdd: '11-15', type: I },
  { title: 'Dia Nacional da Alfabetização', mmdd: '11-14', type: P },
  { title: 'Dia Internacional da Tolerância', mmdd: '11-16', type: P },
  { title: 'Dia Mundial da Prematuridade', mmdd: '11-17', type: P },
  { title: 'Dia Nacional de Combate à Dengue', mmdd: '11-19', type: P },
  { title: 'Dia da Consciência Negra', mmdd: '11-20', type: I },
  { title: 'Dia Mundial da Televisão', mmdd: '11-21' },
  { title: 'Dia Nacional do Doador de Sangue', mmdd: '11-25', type: P },
  { title: 'Dia Internacional para a Eliminação da Violência contra as Mulheres', mmdd: '11-25', type: P },
  { title: 'Dia Nacional de Combate ao Câncer', mmdd: '11-27', type: P },

  { title: 'Dia Mundial de Luta contra a AIDS', mmdd: '12-01', type: P },
  { title: 'Dia Internacional da Pessoa com Deficiência', mmdd: '12-03', type: P },
  { title: 'Dia Internacional do Voluntário', mmdd: '12-05', type: P },
  { title: 'Dia Internacional contra a Corrupção', mmdd: '12-09', type: P },
  { title: 'Dia Internacional dos Direitos Humanos', mmdd: '12-10', type: P },
  { title: 'Dia do Engenheiro', mmdd: '12-11' },
  { title: 'Dia Nacional da Assistência Social', mmdd: '12-07' },
  { title: 'Dia Nacional do Deficiente Visual', mmdd: '12-13', type: P },
  { title: 'Dia do Arquiteto e Urbanista', mmdd: '12-15' },
  { title: 'Dia do Museólogo', mmdd: '12-18' },
  { title: 'Natal', mmdd: '12-25', type: I },
  { title: 'Réveillon', mmdd: '12-31', type: I },
];

function atNoon(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(12, 0, 0, 0);
  return next;
}

// Algoritmo de Meeus/Jones/Butcher para a Páscoa gregoriana.
function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return atNoon(year, month, day);
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const first = atNoon(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return atNoon(year, month, 1 + offset + (nth - 1) * 7);
}

export function movableCalendarEvents(year: number): DatedEvent[] {
  const easter = easterSunday(year);
  return [
    { title: `Carnaval ${year}`, date: addDays(easter, -47), type: C, description: 'Preparar conteúdo de Carnaval e orientações de serviços municipais.' },
    { title: `Quarta-feira de Cinzas ${year}`, date: addDays(easter, -46), type: C, description: 'Avaliar necessidade de comunicado institucional e funcionamento de serviços.' },
    { title: `Sexta-feira Santa ${year}`, date: addDays(easter, -2), type: I, description: 'Preparar conteúdo institucional e comunicados de funcionamento.' },
    { title: `Páscoa ${year}`, date: easter, type: C, description: 'Preparar conteúdo institucional de Páscoa.' },
    { title: `Corpus Christi ${year}`, date: addDays(easter, 60), type: I, description: 'Preparar conteúdo institucional e comunicados de funcionamento.' },
    { title: `Dia das Mães ${year}`, date: nthWeekdayOfMonth(year, 5, 0, 2), type: C, description: 'Preparar homenagem institucional para o Dia das Mães.' },
    { title: `Dia dos Pais ${year}`, date: nthWeekdayOfMonth(year, 8, 0, 2), type: C, description: 'Preparar homenagem institucional para o Dia dos Pais.' },
  ];
}

export async function syncEditorialCalendarBase() {
  const year = new Date().getFullYear();
  const fixedTitles = FIXED_CALENDAR_EVENTS.map(item => item.title);
  const movable = [...movableCalendarEvents(year), ...movableCalendarEvents(year + 1)];
  const movableTitles = movable.map(item => item.title);

  const existing = await db.calendarEvent.findMany({
    where: { title: { in: [...fixedTitles, ...movableTitles] } },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map(item => item.title));

  const fixedToCreate = FIXED_CALENDAR_EVENTS
    .filter(item => !existingTitles.has(item.title))
    .map(item => {
      const [month, day] = item.mmdd.split('-').map(Number);
      return {
        title: item.title,
        description: item.description || `Preparar conteúdo institucional para ${item.title}.`,
        type: item.type || C,
        eventDate: atNoon(year, month, day),
        annual: true,
        leadDays: 3,
        active: true,
      };
    });

  const movableToCreate = movable
    .filter(item => !existingTitles.has(item.title))
    .map(item => ({
      title: item.title,
      description: item.description,
      type: item.type,
      eventDate: item.date,
      annual: false,
      leadDays: 3,
      active: true,
    }));

  const data = [...fixedToCreate, ...movableToCreate];
  if (data.length) await db.calendarEvent.createMany({ data });
  return { created: data.length, totalBase: FIXED_CALENDAR_EVENTS.length + movable.length };
}
