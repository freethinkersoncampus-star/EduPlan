import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import { SOWRow, LessonPlan, UserProfile } from '../types';

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
};

export const exportSOWToDocx = async (sow: SOWRow[], meta: any, profile: UserProfile) => {
  const tableHeader = new TableRow({
    children: [
      "Wk", "Lsn", "Date", "Strand", "Sub Strand", "Outcomes", "Experiences", "Resources", "Assessment"
    ].map(text => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
      shading: { fill: "F3F4F6" }
    }))
  });

  const tableRows = sow.map(r => new TableRow({
    children: [
      r.isBreak ? "-" : r.week.toString(),
      r.isBreak ? "-" : r.lesson.toString(),
      r.date || "-",
      r.strand,
      r.subStrand,
      r.learningOutcomes,
      r.teachingExperiences,
      r.learningResources,
      r.assessmentMethods
    ].map(text => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 16 })] })]
    }))
  }));

  const doc = new Document({
    sections: [{
      properties: { page: { size: { orientation: "landscape" } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: `${meta.year} ${meta.subject} ${meta.grade} SCHEMES OF WORK TERM ${meta.term}`, bold: true, size: 28, underline: {} })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Teacher: ${profile.name} | School: ${profile.school}`, size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [tableHeader, ...tableRows]
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${meta.subject}_Grade${meta.grade}_Term${meta.term}_SOW.docx`);
};

export const exportLessonPlanToDocx = async (plan: LessonPlan, profile: UserProfile) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: `RATIONALIZED LESSON PLAN: ${plan.learningArea}`, bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `School: ${profile.school} | Grade: ${plan.grade} | Term: ${plan.term}`, size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({ children: [new TextRun({ text: `Strand: ${plan.strand}`, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: `Sub-Strand: ${plan.subStrand}`, bold: true })], spacing: { after: 200 } }),
        
        new Paragraph({ children: [new TextRun({ text: "Learning Outcomes:", bold: true })], spacing: { before: 200 } }),
        ...plan.outcomes.map(o => new Paragraph({ children: [new TextRun({ text: `• ${o}` })], indent: { left: 720 } })),

        new Paragraph({ children: [new TextRun({ text: "Lesson Development:", bold: true })], spacing: { before: 400 } }),
        ...plan.lessonDevelopment.map((step, i) => [
          new Paragraph({ children: [new TextRun({ text: `Step ${i + 1}: ${step.title} (${step.duration})`, bold: true })], spacing: { before: 200 } }),
          ...step.content.map(c => new Paragraph({ children: [new TextRun({ text: `• ${c}` })], indent: { left: 720 } }))
        ]).flat(),

        new Paragraph({ children: [new TextRun({ text: "Conclusion:", bold: true })], spacing: { before: 400 } }),
        ...plan.conclusion.map(c => new Paragraph({ children: [new TextRun({ text: `• ${c}` })], indent: { left: 720 } }))
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${plan.learningArea}_${plan.subStrand}_LessonPlan.docx`);
};

export const exportNotesToDocx = async (title: string, content: string) => {
  // Simple markdown-ish to Paragraph conversion
  const lines = content.split('\n');
  const children = [
    new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    ...lines.map(line => {
      const isHeader = line.startsWith('#');
      const text = line.replace(/#/g, '').trim();
      return new Paragraph({
        children: [new TextRun({ text, bold: isHeader, size: isHeader ? 24 : 20 })],
        spacing: { before: isHeader ? 200 : 100 }
      });
    })
  ];

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}_StudyNotes.docx`);
};