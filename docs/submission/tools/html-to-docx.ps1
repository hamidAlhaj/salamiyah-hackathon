# Converts one Word-flavoured HTML file to .docx and .pdf with Microsoft Word (COM) and prints PAGES=<n>.
# Pictures linked from the HTML are embedded into the .docx (links broken) so the file stands alone.
# Called by build-docx.cjs; ASCII paths only (the Node script renames the outputs afterwards).
param(
  [Parameter(Mandatory = $true)][string]$Html,
  [Parameter(Mandatory = $true)][string]$Docx,
  [Parameter(Mandatory = $true)][string]$Pdf
)
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($Html, $false, $true)
  $doc.ActiveWindow.View.Type = 3   # print layout, so the page count is real
  foreach ($shape in @($doc.InlineShapes)) {
    if ($shape.LinkFormat -ne $null) {
      $shape.LinkFormat.SavePictureWithDocument = $true
      $shape.LinkFormat.BreakLink()
    }
  }
  $doc.SaveAs2($Docx, 16)           # wdFormatDocumentDefault (.docx)
  $doc.Close($false)
  $doc = $word.Documents.Open($Docx, $false, $true)
  $doc.Repaginate()
  $pages = $doc.ComputeStatistics(2) # wdStatisticPages
  $doc.SaveAs2($Pdf, 17)            # wdFormatPDF
  $doc.Close($false)
  Write-Output "PAGES=$pages"
}
finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
