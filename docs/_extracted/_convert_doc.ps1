$docPath = "c:/Users/Nguend Arthur Johann/Desktop/SmartCAMPOST/docs/ANALYSIS DOCUMENTS/CAMPOST DOCUMENTS ANALYSIS/fonctionalite EMS Ameliorée (1).doc"
$outPath = "c:/Users/Nguend Arthur Johann/Desktop/SmartCAMPOST/docs/_extracted/docs__ANALYSIS DOCUMENTS__CAMPOST DOCUMENTS ANALYSIS__fonctionalite EMS Ameliorée (1).doc.txt"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($docPath)
$doc.SaveAs([ref]$outPath, [ref]2)
$doc.Close()
$word.Quit()
