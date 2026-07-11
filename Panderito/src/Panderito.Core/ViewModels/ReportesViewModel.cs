using System.Collections.ObjectModel;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public record BarraMes(string Etiqueta, decimal Gasto, double Fraccion, bool EsActual)
{
    public double Altura => 20 + Fraccion * 120; // px: mínimo visible + proporcional
    public string MontoTexto => FormatoMoneda.EnSoles(Gasto);
}

public record CategoriaReporte(GastoPorCategoria Dato, double FraccionDelTotal)
{
    public string TotalTexto => FormatoMoneda.EnSoles(Dato.Total);
    public string PorcentajeTexto => $"{FraccionDelTotal * 100:0}%";
}

public partial class ReportesViewModel : BaseViewModel
{
    private readonly ServicioSaldos _saldos;
    private readonly ServicioMovimientos _movimientos;
    private readonly INavegador _navegador;

    [ObservableProperty] private DateTime _mesReferencia = new(DateTime.Today.Year, DateTime.Today.Month, 1);
    [ObservableProperty] private string _mesTexto = string.Empty;
    [ObservableProperty] private string _gastoMesTexto = "S/ 0.00";
    [ObservableProperty] private string _comparativoTexto = string.Empty;
    [ObservableProperty] private bool _mejorQueMesAnterior;
    [ObservableProperty] private string _ahorroTexto = "S/ 0.00";
    [ObservableProperty] private string _ahorroDetalleTexto = string.Empty;
    [ObservableProperty] private bool _hayGastos;

    public ObservableCollection<BarraMes> Tendencia { get; } = new();
    public ObservableCollection<CategoriaReporte> PorCategoria { get; } = new();

    public ReportesViewModel(ServicioSaldos saldos, ServicioMovimientos movimientos, INavegador navegador)
    {
        _saldos = saldos;
        _movimientos = movimientos;
        _navegador = navegador;
        Titulo = "Reportes";
    }

    [RelayCommand]
    public async Task CargarAsync()
    {
        if (EstaOcupado) return;
        try
        {
            EstaOcupado = true;
            var mes = MesReferencia;
            var mesNombre = mes.ToString("MMMM yyyy", FormatoMoneda.CulturaPeru);
            MesTexto = char.ToUpper(mesNombre[0]) + mesNombre[1..];

            var (ingresos, gastos) = await _saldos.TotalesDelMesAsync(mes.Year, mes.Month);
            var mesAnterior = mes.AddMonths(-1);
            var (_, gastosAnterior) = await _saldos.TotalesDelMesAsync(mesAnterior.Year, mesAnterior.Month);

            GastoMesTexto = FormatoMoneda.EnSoles(gastos);

            var nombreAnterior = mesAnterior.ToString("MMMM", FormatoMoneda.CulturaPeru);
            if (gastosAnterior > 0)
            {
                var variacion = (double)((gastos - gastosAnterior) / gastosAnterior) * 100;
                MejorQueMesAnterior = variacion <= 0;
                ComparativoTexto = variacion <= 0
                    ? $"↓ {Math.Abs(variacion):0}% menos que {nombreAnterior}"
                    : $"↑ {variacion:0}% más que {nombreAnterior}";
            }
            else
            {
                MejorQueMesAnterior = true;
                ComparativoTexto = $"Sin gastos en {nombreAnterior}";
            }

            var ahorro = ingresos - gastos;
            AhorroTexto = FormatoMoneda.EnSoles(ahorro);
            AhorroDetalleTexto = ingresos > 0
                ? $"{(double)(ahorro / ingresos) * 100:0}% de tus ingresos"
                : "Sin ingresos este mes";

            // Tendencia de 6 meses hasta el mes de referencia
            var tendencia = await _movimientos.TendenciaMensualAsync(6, mes);
            var maximo = tendencia.Max(t => t.Gasto);
            Tendencia.Clear();
            foreach (var (anio, numeroMes, gasto) in tendencia)
            {
                var fecha = new DateTime(anio, numeroMes, 1);
                var etiqueta = fecha.ToString("MMM", FormatoMoneda.CulturaPeru).TrimEnd('.');
                Tendencia.Add(new BarraMes(
                    char.ToUpper(etiqueta[0]) + etiqueta[1..],
                    gasto,
                    maximo <= 0 ? 0 : (double)(gasto / maximo),
                    fecha.Year == mes.Year && fecha.Month == mes.Month));
            }

            // Dona → barras por categoría con % del total
            var porCategoria = await _movimientos.GastosPorCategoriaAsync(mes.Year, mes.Month);
            var total = porCategoria.Sum(c => c.Total);
            PorCategoria.Clear();
            foreach (var dato in porCategoria)
                PorCategoria.Add(new CategoriaReporte(dato, total <= 0 ? 0 : (double)(dato.Total / total)));
            HayGastos = PorCategoria.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar los reportes: {ex.Message}");
        }
        finally
        {
            EstaOcupado = false;
        }
    }

    [RelayCommand]
    private async Task MesAnteriorAsync()
    {
        MesReferencia = MesReferencia.AddMonths(-1);
        await CargarAsync();
    }

    [RelayCommand]
    private async Task MesSiguienteAsync()
    {
        MesReferencia = MesReferencia.AddMonths(1);
        await CargarAsync();
    }
}
