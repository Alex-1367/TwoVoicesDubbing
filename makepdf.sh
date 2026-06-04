cd /home/admin/Videos/Translate/B1/KB-Txt/ &&
unoconv -f pdf *.rtf &&
pdfunite $(ls h[0-9]*.pdf | sort -V) B1-kB.pdf