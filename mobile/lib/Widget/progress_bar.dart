import 'package:flutter/material.dart';

class StripedProgressPainter extends CustomPainter {
  final double progress;
  StripedProgressPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    // final paint1 = Paint()..color = Color(0x66050505); // rgb(5 5 5 / 40%)
    final paint2 = Paint()
      ..color = Color.fromARGB(41, 5, 5, 5); // rgb(5 5 5 / 30%)
    // final paint3 = Paint()..color = Color(0x66A2BB6A); // rgb(102 187 106)
    final paint4 = Paint()
      ..color =
          const Color.fromARGB(148, 12, 230, 165); // rgb(102 187 106 / 50%)

    // Step to create angled lines
    double stripeWidth = 10.0; // Width of each stripe
    double offset = 0.0;

    // Loop through and draw diagonal stripes
    for (double i = 0; i < size.width; i += stripeWidth * 2) {
      // Draw the first stripe (angled line)
      // paintStripe(canvas, size, offset, paint1);
      // offset += stripeWidth;
      // Draw the second stripe (angled line)
      paintStripe(canvas, size, offset, paint2);
      offset += stripeWidth;
      // Draw the third stripe (angled line)
      // paintStripe(canvas, size, offset, paint3);
      // offset += stripeWidth;
      // Draw the fourth stripe (angled line)
      paintStripe(canvas, size, offset, paint4);
      offset += stripeWidth;
    }

    // Now draw the progress bar (left to right)
    final rect = Rect.fromLTWH(0, 0, size.width * progress, size.height);
    final progressPaint = Paint()
      ..color =
          Colors.transparent; // Transparent progress to keep stripes visible
    canvas.drawRect(rect, progressPaint);
  }

  void paintStripe(Canvas canvas, Size size, double offset, Paint paint) {
    final path = Path()
      ..moveTo(offset, 0)
      ..lineTo(offset + size.height, size.height)
      ..lineTo(offset + size.height + size.width, size.height + size.height)
      ..lineTo(offset + size.width, 0)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
}

class StripedProgressBar extends StatelessWidget {
  final double progress;
  StripedProgressBar(this.progress);

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      width: 150 * progress, // Set width based on progress (150px * progress)
      height: 20,
      duration: Duration(milliseconds: 300),
      curve: Curves.ease,
      decoration: BoxDecoration(
        color: const Color.fromARGB(255, 212, 212, 212),
        borderRadius: BorderRadius.circular(5),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(5),
        child: CustomPaint(
          size: const Size(double.infinity, double.infinity),
          painter: StripedProgressPainter(progress),
        ),
      ),
    );
  }
}

void main() {
  runApp(MaterialApp(
    home: Scaffold(
      body: Center(
        child: StripedProgressBar(1.0), // Set progress to 1 (100%)
      ),
    ),
  ));
}
